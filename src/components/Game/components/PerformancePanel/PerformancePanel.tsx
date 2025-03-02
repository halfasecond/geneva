import styled from '@emotion/styled';

const Panel = styled.div`
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 10px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    min-width: 200px;
`;

const MetricRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
`;

const Label = styled.span`
    color: #888;
`;

const Value = styled.span<{ warning?: boolean }>`
    color: ${({ warning }: { warning?: boolean }) => warning ? '#ff6b6b' : '#00ff00'};
`;

interface PerformanceMetrics {
    fps: number;
    latency: number;
    updateFrequency: number;
    serverResponseTime: number;
}

interface PerformancePanelProps {
    metrics: PerformanceMetrics;
    visible?: boolean;
}

export function PerformancePanel({ metrics, visible = true }: PerformancePanelProps) {
    if (!visible) return null;

    return (
        <Panel>
            <MetricRow>
                <Label>FPS:</Label>
                <Value warning={metrics.fps < 30}>{metrics.fps}</Value>
            </MetricRow>
            <MetricRow>
                <Label>Latency:</Label>
                <Value warning={metrics.latency > 100}>{metrics.latency}ms</Value>
            </MetricRow>
            <MetricRow>
                <Label>Updates/sec:</Label>
                <Value warning={metrics.updateFrequency < 10}>{metrics.updateFrequency}</Value>
            </MetricRow>
            <MetricRow>
                <Label>Server Response:</Label>
                <Value warning={metrics.serverResponseTime > 100}>{metrics.serverResponseTime}ms</Value>
            </MetricRow>
        </Panel>
    );
}