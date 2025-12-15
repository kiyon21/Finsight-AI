#!/bin/bash

# Script to install PyTorch for Python 3.13

echo "Installing PyTorch for Python 3.13..."
echo ""

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "Python version: $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" == "3.13" ]]; then
    echo "Python 3.13 detected. Installing PyTorch nightly build..."
    echo ""
    
    # Try nightly CPU build first
    echo "Attempting to install PyTorch nightly (CPU)..."
    pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cpu
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "PyTorch installed successfully!"
        python3 -c "import torch; print(f'PyTorch version: {torch.__version__}')"
    else
        echo ""
        echo "Nightly build failed. Trying to install from source..."
        echo "This may take a while..."
        pip install ninja
        pip install torch --no-build-isolation
    fi
else
    echo "Python version is not 3.13. Installing standard PyTorch..."
    pip install torch>=2.0.0
fi

echo ""
echo "Installation complete!"
