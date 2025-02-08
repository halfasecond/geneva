import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Race from './Race';

describe('Race Component', () => {
    const mockOnStateChange = vi.fn();
    const defaultProps = {
        playerHorse: {
            tokenId: '82',
            position: { x: 300, y: 2070 }  // Initial position
        },
        aiHorses: [
            { tokenId: '30', position: { x: 580, y: 1800 } },
            { tokenId: '31', position: { x: 580, y: 1930 } }
        ],
        onStateChange: mockOnStateChange
    };

    beforeEach(() => {
        mockOnStateChange.mockClear();
        vi.useFakeTimers();
    });

    describe('Race Start Conditions', () => {
        it('should not start race when player is outside stall', () => {
            render(<Race {...defaultProps} />);
            expect(mockOnStateChange).not.toHaveBeenCalled();
        });

        it('should start countdown when player enters stall (x between 580-700)', () => {
            const props = {
                ...defaultProps,
                playerHorse: {
                    ...defaultProps.playerHorse,
                    position: { x: 590, y: 2070 }
                }
            };
            render(<Race {...props} />);
            expect(mockOnStateChange).toHaveBeenCalledWith('countdown');
        });

        it('should not start race when player is too far left (x < 580)', () => {
            const props = {
                ...defaultProps,
                playerHorse: {
                    ...defaultProps.playerHorse,
                    position: { x: 570, y: 2070 }
                }
            };
            render(<Race {...props} />);
            expect(mockOnStateChange).not.toHaveBeenCalled();
        });

        it('should not start race when player is too far right (x > 700)', () => {
            const props = {
                ...defaultProps,
                playerHorse: {
                    ...defaultProps.playerHorse,
                    position: { x: 710, y: 2070 }
                }
            };
            render(<Race {...props} />);
            expect(mockOnStateChange).not.toHaveBeenCalled();
        });
    });

    describe('Race State Transitions', () => {
        it('should transition from countdown to racing after 3 seconds', () => {
            const props = {
                ...defaultProps,
                playerHorse: {
                    ...defaultProps.playerHorse,
                    position: { x: 590, y: 2070 }
                }
            };
            render(<Race {...props} />);
            
            // Should be in countdown state
            expect(mockOnStateChange).toHaveBeenCalledWith('countdown');
            expect(screen.getByText('3')).toBeInTheDocument();

            // Advance timers
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(screen.getByText('2')).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(screen.getByText('1')).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(screen.getByText('GO!')).toBeInTheDocument();

            // Should transition to racing state
            expect(mockOnStateChange).toHaveBeenCalledWith('racing');
        });

        it('should transition to finished state when all horses cross finish line', () => {
            const props = {
                ...defaultProps,
                playerHorse: {
                    ...defaultProps.playerHorse,
                    position: { x: 590, y: 2070 }
                }
            };
            render(<Race {...props} />);

            // Start race
            act(() => {
                vi.advanceTimersByTime(3000);  // Get through countdown
            });

            // Move horses to finish line
            act(() => {
                vi.advanceTimersByTime(5000);  // Enough time for horses to reach finish
            });

            // Should transition to finished state
            expect(mockOnStateChange).toHaveBeenCalledWith('finished');
        });
    });

    describe('Race Display', () => {
        it('should show AI horses in their starting positions', () => {
            render(<Race {...defaultProps} />);
            
            // Check AI horses are rendered at correct positions
            const aiHorses = screen.getAllByRole('img', { name: /Horse #/ });
            expect(aiHorses).toHaveLength(2);
            expect(aiHorses[0].parentElement).toHaveStyle({ 
                left: '580px',
                top: '1800px'
            });
            expect(aiHorses[1].parentElement).toHaveStyle({ 
                left: '580px',
                top: '1930px'
            });
        });

        it('should show countdown display during countdown state', () => {
            const props = {
                ...defaultProps,
                playerHorse: {
                    ...defaultProps.playerHorse,
                    position: { x: 590, y: 2070 }
                }
            };
            render(<Race {...props} />);
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('should show podium after race completion', () => {
            const props = {
                ...defaultProps,
                playerHorse: {
                    ...defaultProps.playerHorse,
                    position: { x: 590, y: 2070 }
                }
            };
            render(<Race {...props} />);

            // Start race
            act(() => {
                vi.advanceTimersByTime(3000);  // Get through countdown
            });

            // Move horses to finish line
            act(() => {
                vi.advanceTimersByTime(5000);  // Enough time for horses to reach finish
            });

            // Should show podium
            expect(screen.getByTestId('podium')).toBeInTheDocument();
        });
    });
});