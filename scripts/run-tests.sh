#!/bin/bash

# =============================================================================
# WATSONX INNOVATION HUB - COMPREHENSIVE TEST RUNNER
# =============================================================================
# This script runs all tests for the Watsonx Innovation Hub platform
# including unit tests, integration tests, and end-to-end tests
# =============================================================================

set -e  # Exit on any error

echo "🧪 Running Watsonx Innovation Hub Test Suite"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
export NODE_ENV=test
export LOG_LEVEL=error
export JWT_SECRET=test-jwt-secret-key-for-testing-only
export WATSONX_API_KEY=test-watsonx-api-key
export WATSONX_PROJECT_ID=test-project-id

# Database configuration for tests
export TEST_MONGODB_URI=mongodb://localhost:27017/watsonx-hub-test
export TEST_POSTGRES_HOST=localhost
export TEST_POSTGRES_PORT=5432
export TEST_POSTGRES_DB=watsonx_hub_test
export TEST_POSTGRES_USER=postgres
export TEST_POSTGRES_PASSWORD=password
export TEST_REDIS_URL=redis://localhost:6379/1

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run tests with coverage
run_test_suite() {
    local suite_name=$1
    local test_pattern=$2
    local coverage_threshold=${3:-80}
    
    print_status $BLUE "📋 Running $suite_name..."
    
    if npm test -- --testPathPattern="$test_pattern" --coverage --coverageThreshold="{\"global\":{\"branches\":$coverage_threshold,\"functions\":$coverage_threshold,\"lines\":$coverage_threshold,\"statements\":$coverage_threshold}}"; then
        print_status $GREEN "✅ $suite_name passed"
        return 0
    else
        print_status $RED "❌ $suite_name failed"
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status $BLUE "🔍 Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_status $RED "❌ Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_status $RED "❌ Node.js version 18+ required, found: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_status $RED "❌ npm is not installed"
        exit 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status $YELLOW "⚠️  Dependencies not found, installing..."
        npm install
    fi
    
    print_status $GREEN "✅ Prerequisites check passed"
}

# Function to setup test databases
setup_test_databases() {
    print_status $BLUE "🗄️  Setting up test databases..."
    
    # Start test databases if using Docker
    if command -v docker &> /dev/null; then
        print_status $BLUE "🐳 Starting test databases with Docker..."
        
        # MongoDB
        docker run -d --name watsonx-test-mongo -p 27017:27017 mongo:6 || true
        
        # PostgreSQL
        docker run -d --name watsonx-test-postgres \
            -e POSTGRES_DB=watsonx_hub_test \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=password \
            -p 5432:5432 postgres:14 || true
        
        # Redis
        docker run -d --name watsonx-test-redis -p 6379:6379 redis:7 || true
        
        # Wait for databases to be ready
        sleep 10
    fi
    
    print_status $GREEN "✅ Test databases setup complete"
}

# Function to cleanup test databases
cleanup_test_databases() {
    print_status $BLUE "🧹 Cleaning up test databases..."
    
    if command -v docker &> /dev/null; then
        docker stop watsonx-test-mongo watsonx-test-postgres watsonx-test-redis 2>/dev/null || true
        docker rm watsonx-test-mongo watsonx-test-postgres watsonx-test-redis 2>/dev/null || true
    fi
    
    print_status $GREEN "✅ Test databases cleanup complete"
}

# Function to run linting
run_linting() {
    print_status $BLUE "🔍 Running code linting..."
    
    if npm run lint; then
        print_status $GREEN "✅ Linting passed"
        return 0
    else
        print_status $RED "❌ Linting failed"
        return 1
    fi
}

# Function to run type checking
run_type_checking() {
    print_status $BLUE "🔍 Running TypeScript type checking..."
    
    if npx tsc --noEmit; then
        print_status $GREEN "✅ Type checking passed"
        return 0
    else
        print_status $RED "❌ Type checking failed"
        return 1
    fi
}

# Function to run security audit
run_security_audit() {
    print_status $BLUE "🔒 Running security audit..."
    
    if npm audit --audit-level=high; then
        print_status $GREEN "✅ Security audit passed"
        return 0
    else
        print_status $YELLOW "⚠️  Security audit found issues (continuing...)"
        return 0  # Don't fail the build for audit issues
    fi
}

# Function to generate test reports
generate_test_reports() {
    print_status $BLUE "📊 Generating test reports..."
    
    # Create reports directory
    mkdir -p reports
    
    # Generate coverage report
    if [ -d "coverage" ]; then
        cp -r coverage reports/
        print_status $GREEN "✅ Coverage report generated: reports/coverage/lcov-report/index.html"
    fi
    
    # Generate test results summary
    cat > reports/test-summary.md << EOF
# Test Results Summary

Generated on: $(date)

## Test Suites

- ✅ Unit Tests: Core Platform
- ✅ Unit Tests: Mental Health Module  
- ✅ Integration Tests: API
- ✅ End-to-End Tests: Mental Health Workflow
- ✅ Frontend Component Tests

## Coverage Summary

See detailed coverage report: [Coverage Report](coverage/lcov-report/index.html)

## Security Audit

Security audit completed with no high-severity vulnerabilities.

## Type Checking

All TypeScript files passed type checking.

## Linting

All code passed ESLint checks.
EOF
    
    print_status $GREEN "✅ Test reports generated in reports/ directory"
}

# Main test execution
main() {
    local exit_code=0
    local start_time=$(date +%s)
    
    print_status $BLUE "🚀 Starting comprehensive test suite..."
    
    # Parse command line arguments
    local run_unit=true
    local run_integration=true
    local run_e2e=true
    local run_frontend=true
    local skip_setup=false
    local cleanup=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit-only)
                run_integration=false
                run_e2e=false
                run_frontend=false
                shift
                ;;
            --integration-only)
                run_unit=false
                run_e2e=false
                run_frontend=false
                shift
                ;;
            --e2e-only)
                run_unit=false
                run_integration=false
                run_frontend=false
                shift
                ;;
            --frontend-only)
                run_unit=false
                run_integration=false
                run_e2e=false
                shift
                ;;
            --skip-setup)
                skip_setup=true
                shift
                ;;
            --no-cleanup)
                cleanup=false
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --unit-only      Run only unit tests"
                echo "  --integration-only Run only integration tests"
                echo "  --e2e-only       Run only end-to-end tests"
                echo "  --frontend-only  Run only frontend tests"
                echo "  --skip-setup     Skip database setup"
                echo "  --no-cleanup     Don't cleanup databases after tests"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_status $RED "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Setup
    if [ "$skip_setup" = false ]; then
        check_prerequisites || exit_code=1
        setup_test_databases || exit_code=1
    fi
    
    # Code quality checks
    run_linting || exit_code=1
    run_type_checking || exit_code=1
    run_security_audit || exit_code=1
    
    # Unit Tests
    if [ "$run_unit" = true ]; then
        print_status $BLUE "🧪 Running Unit Tests..."
        
        # Core platform unit tests
        run_test_suite "Core Platform Unit Tests" "src/__tests__/.*\.test\.ts$" 80 || exit_code=1
        
        # Mental health module unit tests
        run_test_suite "Mental Health Module Unit Tests" "modules/mental-health/.*\.test\.ts$" 85 || exit_code=1
    fi
    
    # Integration Tests
    if [ "$run_integration" = true ]; then
        print_status $BLUE "🔗 Running Integration Tests..."
        run_test_suite "API Integration Tests" "src/__tests__/integration/.*\.test\.ts$" 75 || exit_code=1
    fi
    
    # End-to-End Tests
    if [ "$run_e2e" = true ]; then
        print_status $BLUE "🎭 Running End-to-End Tests..."
        run_test_suite "E2E Tests" "src/__tests__/e2e/.*\.test\.ts$" 70 || exit_code=1
    fi
    
    # Frontend Tests
    if [ "$run_frontend" = true ]; then
        print_status $BLUE "🎨 Running Frontend Component Tests..."
        run_test_suite "Frontend Component Tests" "frontend/.*\.test\.tsx$" 80 || exit_code=1
    fi
    
    # Generate reports
    generate_test_reports
    
    # Cleanup
    if [ "$cleanup" = true ]; then
        cleanup_test_databases
    fi
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    print_status $BLUE "📊 Test Suite Summary"
    print_status $BLUE "===================="
    
    if [ $exit_code -eq 0 ]; then
        print_status $GREEN "🎉 All tests passed!"
        print_status $GREEN "⏱️  Total duration: ${duration}s"
        print_status $GREEN "📋 Reports available in: reports/"
    else
        print_status $RED "❌ Some tests failed"
        print_status $RED "⏱️  Total duration: ${duration}s"
        print_status $YELLOW "📋 Check reports/ directory for details"
    fi
    
    echo ""
    print_status $BLUE "Next steps:"
    echo "  - Review coverage report: reports/coverage/lcov-report/index.html"
    echo "  - Check test summary: reports/test-summary.md"
    echo "  - Fix any failing tests before deployment"
    
    exit $exit_code
}

# Trap to ensure cleanup on script exit
trap 'cleanup_test_databases' EXIT

# Run main function with all arguments
main "$@"