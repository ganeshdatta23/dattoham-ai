import * as vscode from 'vscode';

export interface TelemetryEvent {
    event: string;
    properties?: Record<string, any>;
    timestamp: number;
}

export class TelemetryService {
    private enabled: boolean = false;

    constructor() {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        this.enabled = config.get('enableTelemetry', false);
    }

    async trackEvent(event: string, properties?: Record<string, any>) {
        if (!this.enabled) {return;}

        const telemetryEvent: TelemetryEvent = {
            event,
            properties: {
                ...properties,
                version: vscode.extensions.getExtension('dattoham-ai')?.packageJSON.version
            },
            timestamp: Date.now()
        };

        // Send to analytics endpoint (stub)
        console.log('📊 Telemetry:', telemetryEvent);
    }

    async trackPerformance(operation: string, duration: number, success: boolean) {
        await this.trackEvent('performance', {
            operation,
            duration,
            success
        });
    }

    async trackError(error: Error, context?: string) {
        await this.trackEvent('error', {
            message: error.message,
            stack: error.stack,
            context
        });
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        config.update('enableTelemetry', enabled, vscode.ConfigurationTarget.Global);
    }
}