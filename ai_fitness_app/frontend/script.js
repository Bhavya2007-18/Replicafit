// Poll the backend periodically to get updated stats
async function updateStats() {
    try {
        const response = await fetch("http://localhost:5000/status");
        if (response.ok) {
            const data = await response.json();
            document.getElementById('rep-count').innerText = data.squats_completed;
            document.getElementById('feedback-text').innerText = data.feedback;
        }
    } catch (error) {
        console.error("Failed to connect to backend:", error);
    }
}

// Update stats every 500ms
setInterval(updateStats, 500);
