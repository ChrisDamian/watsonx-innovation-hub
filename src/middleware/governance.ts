import { Request, Response, NextFunction } from 'express';
import { GovernanceRule, GovernanceResult, ErrorType } from '../types';
import { logger } from '../utils/logger';
import { pgPool } from '../config/database';

export interface GovernanceRequest extends Request {
  governanceResults?: GovernanceResult[];
}

export class GovernanceMiddleware {
  
  static async checkBias(req: GovernanceRequest, res: Response, next: NextFunction) {
    try {
      const { modelId, input, output } = req.body;
      
      if (!modelId) {
        return next();
      }

      // Get bias rules for the model
      const client = await pgPool.connect();
      const rulesQuery = `
        SELECT * FROM governance_rules 
        WHERE type = 'bias_detection' 
        AND is_active = true 
        AND (module_ids @> $1 OR module_ids = '[]')
      `;
      
      const rulesResult = await client.query(rulesQuery, [JSON.stringify([req.params.moduleId])]);
      client.release();

      const biasResults: GovernanceResult[] = [];

      for (const rule of rulesResult.rows) {
        const biasCheck = await GovernanceMiddleware.performBiasCheck(
          modelId, 
          input, 
          output, 
          rule.config
        );
        
        biasResults.push({
          ruleId: rule.id,
          status: biasCheck.passed ? 'passed' : 'failed',
          details: biasCheck.details,
          timestamp: new Date()
        });

        if (!biasCheck.passed && rule.config.blockOnFailure) {
          logger.warn('Bias check failed, blocking request:', biasCheck);
          return res.status(400).json({
            success: false,
            error: {
              code: 'GOVERNANCE_BIAS_VIOLATION',
              type: ErrorType.GOVERNANCE_VIOLATION,
              message: 'Request blocked due to bias detection failure',
              details: biasCheck.details,
              timestamp: new Date()
            }
          });
        }
      }

      req.governanceResults = (req.governanceResults || []).concat(biasResults);
      next();
    } catch (error) {
      logger.error('Error in bias check middleware:', error);
      next(error);
    }
  }

  static async checkCompliance(req: GovernanceRequest, res: Response, next: NextFunction) {
    try {
      const { moduleId } = req.params;
      const { dataClassification, userLocation } = req.body;

      // Get compliance rules
      const client = await pgPool.connect();
      const rulesQuery = `
        SELECT * FROM governance_rules 
        WHERE type = 'compliance' 
        AND is_active = true 
        AND (module_ids @> $1 OR module_ids = '[]')
      `;
      
      const rulesResult = await client.query(rulesQuery, [JSON.stringify([moduleId])]);
      client.release();

      const complianceResults: GovernanceResult[] = [];

      for (const rule of rulesResult.rows) {
        const complianceCheck = await GovernanceMiddleware.performComplianceCheck(
          dataClassification,
          userLocation,
          rule.config
        );
        
        complianceResults.push({
          ruleId: rule.id,
          status: complianceCheck.passed ? 'passed' : 'failed',
          details: complianceCheck.details,
          timestamp: new Date()
        });

        if (!complianceCheck.passed && rule.config.blockOnFailure) {
          logger.warn('Compliance check failed, blocking request:', complianceCheck);
          return res.status(403).json({
            success: false,
            error: {
              code: 'GOVERNANCE_COMPLIANCE_VIOLATION',
              type: ErrorType.GOVERNANCE_VIOLATION,
              message: 'Request blocked due to compliance violation',
              details: complianceCheck.details,
              timestamp: new Date()
            }
          });
        }
      }

      req.governanceResults = (req.governanceResults || []).concat(complianceResults);
      next();
    } catch (error) {
      logger.error('Error in compliance check middleware:', error);
      next(error);
    }
  }

  static async requireExplanation(req: GovernanceRequest, res: Response, next: NextFunction) {
    try {
      const { modelId } = req.body;
      
      if (!modelId) {
        return next();
      }

      // Check if explanation is required for this model
      const client = await pgPool.connect();
      const rulesQuery = `
        SELECT * FROM governance_rules 
        WHERE type = 'explainability' 
        AND is_active = true 
        AND (module_ids @> $1 OR module_ids = '[]')
      `;
      
      const rulesResult = await client.query(rulesQuery, [JSON.stringify([req.params.moduleId])]);
      client.release();

      for (const rule of rulesResult.rows) {
        if (rule.config.required && !req.body.generateExplanation) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'GOVERNANCE_EXPLANATION_REQUIRED',
              type: ErrorType.GOVERNANCE_VIOLATION,
              message: 'Explanation is required for this model prediction',
              timestamp: new Date()
            }
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Error in explanation requirement middleware:', error);
      next(error);
    }
  }

  static async auditLog(req: GovernanceRequest, res: Response, next: NextFunction) {
    try {
      const originalSend = res.send;
      
      res.send = function(data: any) {
        // Log the request and response
        GovernanceMiddleware.logAuditTrail(req, res, data);
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error in audit log middleware:', error);
      next(error);
    }
  }

  private static async performBiasCheck(
    modelId: string, 
    input: any, 
    output: any, 
    config: any
  ): Promise<{ passed: boolean; details: string }> {
    try {
      // Simplified bias check - in production, this would use Watsonx governance APIs
      const protectedAttribute = config.protectedAttribute;
      const threshold = config.threshold || 0.8;

      if (!input[protectedAttribute]) {
        return { passed: true, details: 'No protected attribute found in input' };
      }

      // Mock bias calculation
      const biasScore = Math.random();
      const passed = biasScore >= threshold;

      return {
        passed,
        details: `Bias score: ${biasScore.toFixed(3)}, threshold: ${threshold}, attribute: ${protectedAttribute}`
      };
    } catch (error) {
      logger.error('Error performing bias check:', error);
      return { passed: false, details: 'Bias check failed due to error' };
    }
  }

  private static async performComplianceCheck(
    dataClassification: string,
    userLocation: string,
    config: any
  ): Promise<{ passed: boolean; details: string }> {
    try {
      const regulation = config.regulation;
      const allowedRegions = config.allowedRegions || [];
      const allowedClassifications = config.allowedClassifications || [];

      // Check regional compliance
      if (allowedRegions.length > 0 && !allowedRegions.includes(userLocation)) {
        return {
          passed: false,
          details: `User location ${userLocation} not allowed for ${regulation}`
        };
      }

      // Check data classification compliance
      if (allowedClassifications.length > 0 && !allowedClassifications.includes(dataClassification)) {
        return {
          passed: false,
          details: `Data classification ${dataClassification} not allowed for ${regulation}`
        };
      }

      return { passed: true, details: `Compliance check passed for ${regulation}` };
    } catch (error) {
      logger.error('Error performing compliance check:', error);
      return { passed: false, details: 'Compliance check failed due to error' };
    }
  }

  private static async logAuditTrail(req: GovernanceRequest, res: Response, responseData: any) {
    try {
      const client = await pgPool.connect();
      
      const auditData = {
        action: `${req.method} ${req.path}`,
        user_id: (req as any).user?.id || null,
        module_id: req.params.moduleId || null,
        model_id: req.body?.modelId || null,
        details: {
          request: {
            body: req.body,
            query: req.query,
            params: req.params
          },
          response: {
            statusCode: res.statusCode,
            data: responseData
          },
          governanceResults: req.governanceResults || []
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      };

      await client.query(`
        INSERT INTO audit_logs (action, user_id, module_id, model_id, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        auditData.action,
        auditData.user_id,
        auditData.module_id,
        auditData.model_id,
        JSON.stringify(auditData.details),
        auditData.ip_address,
        auditData.user_agent
      ]);

      client.release();
    } catch (error) {
      logger.error('Error logging audit trail:', error);
    }
  }
}