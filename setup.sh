#!/bin/bash

# Auto UI Setup Script
# This script automates the entire setup process

set -e  # Exit on any error

echo "🚀 Auto UI Setup Script"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${BLUE}🔍 $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory (pilot-replit-ux-craft)"
    exit 1
fi

print_step "Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION is installed"
else
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python $PYTHON_VERSION is installed"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    print_success "Python $PYTHON_VERSION is installed"
    PYTHON_CMD="python"
else
    print_error "Python is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git is installed"
else
    print_warning "Git is not installed (optional but recommended)"
fi

print_step "Installing Frontend Dependencies"

# Install Node.js dependencies
if [ -d "node_modules" ]; then
    print_warning "node_modules already exists, skipping npm install"
else
    print_success "Installing Node.js dependencies..."
    npm install
fi

print_step "Setting up Backend"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_success "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
else
    print_warning "Virtual environment already exists"
fi

# Activate virtual environment
print_success "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_success "Installing Python dependencies..."
pip install -r requirements.txt

# Install Playwright browsers
print_success "Installing Playwright browsers..."
playwright install chromium

# Create screenshots directory
if [ ! -d "screenshots" ]; then
    print_success "Creating screenshots directory..."
    mkdir -p screenshots
fi

# Go back to root
cd ..

print_step "Setup Complete!"

print_success "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the screenshot server:"
echo "   cd backend && source venv/bin/activate && python run_screenshot_server.py"
echo ""
echo "2. Start the main API server (in a new terminal):"
echo "   cd backend && source venv/bin/activate && python main.py"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   npm run dev"
echo ""
echo "4. Test your setup:"
echo "   cd backend && source venv/bin/activate && python test_setup.py"
echo ""
echo "5. Visit http://localhost:5173 to use the application"
echo ""
print_warning "Remember to activate the virtual environment before running backend commands!" 