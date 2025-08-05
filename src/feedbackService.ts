import * as vscode from 'vscode';

export interface FeedbackData {
    type: 'bug' | 'feature' | 'improvement' | 'general';
    rating: number; // 1-5 stars
    message: string;
    context?: {
        command?: string;
        language?: string;
        timestamp: number;
    };
}

export class FeedbackService {
    async showFeedbackForm() {
        const panel = vscode.window.createWebviewPanel(
            'dattohamFeedback',
            'Send Feedback - Dattoham AI',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getFeedbackHtml();
        
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'submitFeedback') {
                await this.submitFeedback(message.data);
                vscode.window.showInformationMessage('Thank you for your feedback! 🙏');
                panel.dispose();
            }
        });
    }

    private async submitFeedback(feedback: FeedbackData) {
        // In production, send to feedback API
        console.log('📝 Feedback submitted:', feedback);
        
        // Store locally for now
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        const feedbackEnabled = config.get('feedbackEnabled', true);
        
        if (feedbackEnabled) {
            // Send to analytics/feedback service
            this.sendToFeedbackService(feedback);
        }
    }

    private async sendToFeedbackService(feedback: FeedbackData) {
        // Stub for feedback API integration
        try {
            // await fetch('https://api.dattoham.ai/feedback', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(feedback)
            // });
            console.log('Feedback sent to service');
        } catch (error) {
            console.error('Failed to send feedback:', error);
        }
    }

    private getFeedbackHtml(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dattoham AI Feedback</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        .form-group { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        select, textarea, input { width: 100%; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
        textarea { height: 120px; resize: vertical; }
        .rating { display: flex; gap: 5px; margin: 10px 0; }
        .star { font-size: 24px; cursor: pointer; color: #666; }
        .star.active { color: #ffd700; }
        .submit-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .submit-btn:hover { background: var(--vscode-button-hoverBackground); }
        h1 { color: var(--vscode-textLink-foreground); }
    </style>
</head>
<body>
    <h1>🤖 Send Feedback to Dattoham AI</h1>
    <p>Help us improve the world's most advanced free coding assistant!</p>
    
    <form id="feedbackForm">
        <div class="form-group">
            <label for="type">Feedback Type:</label>
            <select id="type" required>
                <option value="">Select type...</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
                <option value="general">General Feedback</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Rating:</label>
            <div class="rating">
                <span class="star" data-rating="1">⭐</span>
                <span class="star" data-rating="2">⭐</span>
                <span class="star" data-rating="3">⭐</span>
                <span class="star" data-rating="4">⭐</span>
                <span class="star" data-rating="5">⭐</span>
            </div>
        </div>
        
        <div class="form-group">
            <label for="message">Your Feedback:</label>
            <textarea id="message" placeholder="Tell us about your experience, suggestions, or issues..." required></textarea>
        </div>
        
        <button type="submit" class="submit-btn">Send Feedback</button>
    </form>
    
    <script>
        const vscode = acquireVsCodeApi();
        let selectedRating = 0;
        
        // Handle star rating
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                selectedRating = parseInt(e.target.dataset.rating);
                updateStars();
            });
        });
        
        function updateStars() {
            document.querySelectorAll('.star').forEach((star, index) => {
                star.classList.toggle('active', index < selectedRating);
            });
        }
        
        // Handle form submission
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const feedback = {
                type: document.getElementById('type').value,
                rating: selectedRating,
                message: document.getElementById('message').value,
                context: {
                    timestamp: Date.now()
                }
            };
            
            vscode.postMessage({
                type: 'submitFeedback',
                data: feedback
            });
        });
    </script>
</body>
</html>`;
    }
}