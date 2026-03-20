# AI Fitness Web App - Complete Setup Guide

This guide details exactly how to fix your Python environment, install the application dependencies, and run your real-time AI squat coach. All code has been optimized for clean structure, smooth tracking, and decoupled architecture.

## Step 1: Install Python 3.12 
Since your previous Python 3.14 installation was broken ("Could not resolve interpreter path"), we will install a stable version. Open Windows PowerShell as Administrator and run:

```powershell
winget install -e --id Python.Python.3.12 --scope machine
```

Wait until the installation completes successfully. **Close your terminal and completely restart VS Code.** Verify Python works by opening a new terminal in VS Code and typing:
```powershell
python --version
```

## Step 2: Set Up the Virtual Environment

Open a fresh terminal in VS Code (``Ctrl + ` ``). Make sure you are inside the newly created project root directory:

```powershell
cd "d:\GIT WORK AND STUDY\Strivio\ai_fitness_app"
```

Create and activate your virtual environment:

```powershell
# Create virtual environment
python -m venv venv

# Activate it (Windows)
.\venv\Scripts\activate
```

The terminal prompt should now show `(venv)` at the beginning of the line. Now install all required dependencies:

```powershell
pip install -r backend/requirements.txt
```

## Step 3: Fix VS Code Interpreter Error
Your editor needs to know about the virtual environment so Pylance stops complaining.
1. Press **`Ctrl + Shift + P`** to open the Command Palette.
2. Type and select **`Python: Select Interpreter`**.
3. Locate and select the interpreter inside your new `venv` folder (it should look like `Python 3.12.x ('venv': venv) .\venv\Scripts\python.exe`). 
*(If VS Code asks you to clear the old broken C:\Users\bhavy\AppData... path, approve it!)*

## Step 4: Run the Application!

### Start the AI Backend API:
With your `(venv)` still activated in the terminal, launch the highly-optimized Flask server:

```powershell
python backend/app.py
```
You should see: `Running on http://127.0.0.1:5000`. Keep this terminal open!

### Open the Frontend Interface:
The frontend UI allows viewing the video feed directly from your API without lagging out the browser.
1. Double-click `frontend/index.html` in File Explorer to open it in Chrome/Edge, OR
2. In VS Code, right-click `frontend/index.html` and click **"Open with Live Server"**.

Allow camera access if prompted. Your live webcam feed with body keypoints and squat counter will stream at 30 FPS instantly!

## Troubleshooting
- **"Video Feed Loading..." / Broken Image icon:** Ensure you have started the Flask backend (`python backend/app.py`). If the backend crashes, check your terminal for errors—ensure `(venv)` was activated before running.
- **"ModuleNotFoundError: No module named 'cv2'"**: The dependencies in `requirements.txt` were not installed correctly, or your terminal is not running inside the `(venv)`. Activate the venv and install them.
- **Camera does not open:** Ensure Teams, Zoom, or another browser tab is not currently utilizing your webcam. If you have multiple cameras, change `cv2.VideoCapture(0)` to `cv2.VideoCapture(1)` in `backend/app.py`.
