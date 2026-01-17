// ============= JCAS Multibeam Visualization Library =============

class JCASVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.charts = {};
    }

    // ========== 1. RADIATION PATTERN - Polar Plot ==========
    createRadiationPatternPolar(pattern, title = "Multibeam Radiation Pattern") {
        const canvas = document.createElement('canvas');
        canvas.id = 'radiationPatternPolar';
        canvas.width = 600;
        canvas.height = 600;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 250;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw polar grid
        this.drawPolarGrid(ctx, centerX, centerY, radius);

        // Normalize pattern to 0-1 for plotting
        const maxMag = Math.max(...pattern.map(p => p.magnitude));
        
        // Draw radiation pattern
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;

        pattern.forEach((point, idx) => {
            const angle = (point.angle - 90) * Math.PI / 180; // Convert to radians, rotate
            const normalizedMag = point.magnitude / maxMag;
            const r = radius * normalizedMag;
            
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);

            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.stroke();

        // Fill pattern
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#2196F3';
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(title, centerX, 30);

        // Draw angle markers
        this.drawAngleMarkers(ctx, centerX, centerY, radius);
    }

    drawPolarGrid(ctx, centerX, centerY, radius) {
        // Draw concentric circles
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 5; i++) {
            const r = (radius / 5) * i;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
            ctx.stroke();

            // Label circles with dB values
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`-${(5 - i) * 6} dB`, centerX - 5, centerY - r);
        }

        // Draw radial lines (every 30 degrees)
        for (let angle = 0; angle < 360; angle += 30) {
            const rad = (angle - 90) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + radius * Math.cos(rad),
                centerY + radius * Math.sin(rad)
            );
            ctx.stroke();
        }

        // Draw main axes thicker
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.stroke();

        // Vertical
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, centerY + radius);
        ctx.stroke();
    }

    drawAngleMarkers(ctx, centerX, centerY, radius) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        
        const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
        angles.forEach(angle => {
            const rad = (angle - 90) * Math.PI / 180;
            const r = radius + 25;
            const x = centerX + r * Math.cos(rad);
            const y = centerY + r * Math.sin(rad);
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${(angle + 90) % 360 - 180}°`, x, y);
        });
    }

    // ========== 2. RADIATION PATTERN - Cartesian Plot ==========
    createRadiationPatternCartesian(pattern, title = "Radiation Pattern (dB)") {
        const canvas = document.createElement('canvas');
        canvas.id = 'radiationPatternCartesian';
        canvas.width = 800;
        canvas.height = 400;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const padding = 60;
        const plotWidth = canvas.width - 2 * padding;
        const plotHeight = canvas.height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw axes
        this.drawCartesianAxes(ctx, padding, plotWidth, plotHeight, -90, 90, -40, 5);

        // Plot data
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;

        pattern.forEach((point, idx) => {
            const x = padding + ((point.angle + 90) / 180) * plotWidth;
            const y = padding + plotHeight - ((point.magnitudeDB + 40) / 45) * plotHeight;

            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Add title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 30);

        // Add axis labels
        ctx.font = '12px Arial';
        ctx.fillText('Angle (degrees)', canvas.width / 2, canvas.height - 10);
        
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Magnitude (dB)', 0, 0);
        ctx.restore();
    }

    drawCartesianAxes(ctx, padding, width, height, xMin, xMax, yMin, yMax) {
        // Draw frame
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, width, height);

        // Draw grid
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;

        // Vertical grid lines
        for (let x = xMin; x <= xMax; x += 30) {
            const px = padding + ((x - xMin) / (xMax - xMin)) * width;
            ctx.beginPath();
            ctx.moveTo(px, padding);
            ctx.lineTo(px, padding + height);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(x.toString(), px, padding + height + 15);
        }

        // Horizontal grid lines
        for (let y = yMin; y <= yMax; y += 10) {
            const py = padding + height - ((y - yMin) / (yMax - yMin)) * height;
            ctx.beginPath();
            ctx.moveTo(padding, py);
            ctx.lineTo(padding + width, py);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(y.toString(), padding - 5, py + 3);
        }
    }

    // ========== 3. MULTIBEAM COMPARISON ==========
    createMultibeamComparison(commPattern, sensingPattern, combinedPattern) {
        const canvas = document.createElement('canvas');
        canvas.id = 'multibeamComparison';
        canvas.width = 800;
        canvas.height = 400;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const padding = 60;
        const plotWidth = canvas.width - 2 * padding;
        const plotHeight = canvas.height - 2 * padding;

        ctx.clearRect(0, 0, canvas.width, canvas.width);

        // Draw axes
        this.drawCartesianAxes(ctx, padding, plotWidth, plotHeight, -90, 90, -40, 5);

        // Plot communication beam
        this.plotPattern(ctx, padding, plotWidth, plotHeight, commPattern, '#4CAF50', 2);
        
        // Plot sensing beam
        this.plotPattern(ctx, padding, plotWidth, plotHeight, sensingPattern, '#FF9800', 2);
        
        // Plot combined beam
        this.plotPattern(ctx, padding, plotWidth, plotHeight, combinedPattern, '#2196F3', 3);

        // Add legend
        this.drawLegend(ctx, canvas.width - 150, 60, [
            { color: '#4CAF50', label: 'Communication' },
            { color: '#FF9800', label: 'Sensing' },
            { color: '#2196F3', label: 'Combined' }
        ]);

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('Multibeam Comparison', canvas.width / 2, 30);
    }

    plotPattern(ctx, padding, width, height, pattern, color, lineWidth) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        pattern.forEach((point, idx) => {
            const x = padding + ((point.angle + 90) / 180) * width;
            const y = padding + height - ((point.magnitudeDB + 40) / 45) * height;

            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    drawLegend(ctx, x, y, items) {
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        items.forEach((item, idx) => {
            const yPos = y + idx * 25;

            // Draw line
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, yPos);
            ctx.lineTo(x + 30, yPos);
            ctx.stroke();

            // Draw label
            ctx.fillStyle = '#000';
            ctx.fillText(item.label, x + 40, yPos + 4);
        });
    }

    // ========== 4. CONVERGENCE PLOT ==========
    createConvergencePlot(fitnessHistory, title = "GA Convergence") {
        const canvas = document.createElement('canvas');
        canvas.id = 'convergencePlot';
        canvas.width = 800;
        canvas.height = 400;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const padding = 60;
        const plotWidth = canvas.width - 2 * padding;
        const plotHeight = canvas.height - 2 * padding;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Find data ranges
        const generations = fitnessHistory.map(h => h.generation);
        const bestFitness = fitnessHistory.map(h => h.best);
        const avgFitness = fitnessHistory.map(h => h.avg);

        const maxGen = Math.max(...generations);
        const maxFit = Math.max(...bestFitness, ...avgFitness);
        const minFit = Math.min(...bestFitness, ...avgFitness);

        // Draw axes
        this.drawCartesianAxes(ctx, padding, plotWidth, plotHeight, 
            0, maxGen, Math.floor(minFit), Math.ceil(maxFit));

        // Plot best fitness
        this.plotConvergenceLine(ctx, padding, plotWidth, plotHeight, 
            generations, bestFitness, maxGen, minFit, maxFit, '#4CAF50', 3);

        // Plot average fitness
        this.plotConvergenceLine(ctx, padding, plotWidth, plotHeight, 
            generations, avgFitness, maxGen, minFit, maxFit, '#FF9800', 2);

        // Legend
        this.drawLegend(ctx, canvas.width - 150, 60, [
            { color: '#4CAF50', label: 'Best Fitness' },
            { color: '#FF9800', label: 'Avg Fitness' }
        ]);

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 30);

        // Axis labels
        ctx.font = '12px Arial';
        ctx.fillText('Generation', canvas.width / 2, canvas.height - 10);
        
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Fitness', 0, 0);
        ctx.restore();
    }

    plotConvergenceLine(ctx, padding, width, height, xData, yData, maxX, minY, maxY, color, lineWidth) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        xData.forEach((x, idx) => {
            const px = padding + (x / maxX) * width;
            const py = padding + height - ((yData[idx] - minY) / (maxY - minY)) * height;

            if (idx === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        });
        ctx.stroke();
    }

    // ========== 5. DIVERSITY PLOT ==========
    createDiversityPlot(fitnessHistory) {
        const canvas = document.createElement('canvas');
        canvas.id = 'diversityPlot';
        canvas.width = 800;
        canvas.height = 400;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const padding = 60;
        const plotWidth = canvas.width - 2 * padding;
        const plotHeight = canvas.height - 2 * padding;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Extract data
        const generations = fitnessHistory.map(h => h.generation);
        const diversity = fitnessHistory.map(h => h.diversity);

        const maxGen = Math.max(...generations);
        const maxDiv = Math.max(...diversity);
        const minDiv = Math.min(...diversity);

        // Draw axes
        this.drawCartesianAxes(ctx, padding, plotWidth, plotHeight, 
            0, maxGen, 0, Math.ceil(maxDiv * 10) / 10);

        // Plot diversity
        this.plotConvergenceLine(ctx, padding, plotWidth, plotHeight, 
            generations, diversity, maxGen, 0, maxDiv, '#9C27B0', 2);

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('Population Diversity Over Time', canvas.width / 2, 30);

        // Axis labels
        ctx.font = '12px Arial';
        ctx.fillText('Generation', canvas.width / 2, canvas.height - 10);
        
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Diversity', 0, 0);
        ctx.restore();
    }

    // ========== 6. ANTENNA ARRAY LAYOUT ==========
    createAntennaArrayLayout(M, elementSpacing = 0.5) {
        const canvas = document.createElement('canvas');
        canvas.id = 'antennaArray';
        canvas.width = 800;
        canvas.height = 200;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerY = canvas.height / 2;
        const scale = 30; // pixels per wavelength
        const totalWidth = (M - 1) * elementSpacing * scale;
        const startX = (canvas.width - totalWidth) / 2;

        // Draw array elements
        for (let m = 0; m < M; m++) {
            const x = startX + m * elementSpacing * scale;
            
            // Draw antenna element
            ctx.fillStyle = '#2196F3';
            ctx.beginPath();
            ctx.arc(x, centerY, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = '#1976D2';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw element number
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${m}`, x, centerY + 25);
        }

        // Draw spacing indicator
        if (M > 1) {
            const y = centerY + 50;
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + elementSpacing * scale, y);
            ctx.stroke();
            
            ctx.setLineDash([]);

            // Arrow heads
            this.drawArrowHead(ctx, startX, y, -1);
            this.drawArrowHead(ctx, startX + elementSpacing * scale, y, 1);

            // Label
            ctx.fillStyle = '#000';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`λ/2 = ${elementSpacing}λ`, startX + elementSpacing * scale / 2, y + 15);
        }

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(`Uniform Linear Array (ULA) - ${M} Elements`, canvas.width / 2, 30);
    }

    drawArrowHead(ctx, x, y, direction) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + direction * 5, y - 5);
        ctx.moveTo(x, y);
        ctx.lineTo(x + direction * 5, y + 5);
        ctx.stroke();
    }

    // ========== 7. BEAMFORMING WEIGHTS VISUALIZATION ==========
    createWeightsVisualization(commWeights, sensingWeights) {
        const canvas = document.createElement('canvas');
        canvas.id = 'weightsViz';
        canvas.width = 800;
        canvas.height = 400;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const M = commWeights.length;
        const padding = 60;
        const plotWidth = canvas.width - 2 * padding;
        const barWidth = plotWidth / (M * 2.5);
        const maxHeight = 150;

        // Find max magnitude
        const maxMag = Math.max(
            ...commWeights.map(w => w.magnitude()),
            ...sensingWeights.map(w => w.magnitude())
        );

        // Draw communication weights
        commWeights.forEach((w, idx) => {
            const x = padding + idx * (plotWidth / M);
            const mag = w.magnitude();
            const height = (mag / maxMag) * maxHeight;
            
            // Magnitude bar
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(x, 200 - height, barWidth * 0.8, height);
            
            // Phase indicator (small circle on top)
            const phase = w.phase();
            const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.beginPath();
            ctx.arc(x + barWidth * 0.4, 200 - height - 10, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Element label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(idx.toString(), x + barWidth * 0.4, 215);
        });

        // Draw sensing weights
        sensingWeights.forEach((w, idx) => {
            const x = padding + idx * (plotWidth / M);
            const mag = w.magnitude();
            const height = (mag / maxMag) * maxHeight;
            
            // Magnitude bar
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(x, 250, barWidth * 0.8, height);
            
            // Phase indicator
            const phase = w.phase();
            const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.beginPath();
            ctx.arc(x + barWidth * 0.4, 250 + height + 10, 5, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Labels
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Communication Weights', padding, 180);
        ctx.fillText('Sensing Weights', padding, 230);

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Beamforming Weights - Magnitude & Phase', canvas.width / 2, 30);

        // Phase legend
        this.drawPhaseColorbar(ctx, canvas.width - 100, 60, 30, 150);
    }

    drawPhaseColorbar(ctx, x, y, width, height) {
        const steps = 50;
        const stepHeight = height / steps;

        for (let i = 0; i < steps; i++) {
            const hue = (i / steps) * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(x, y + i * stepHeight, width, stepHeight);
        }

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Labels
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('π', x + width + 5, y + 5);
        ctx.fillText('0', x + width + 5, y + height / 2 + 5);
        ctx.fillText('-π', x + width + 5, y + height);

        ctx.font = 'bold 11px Arial';
        ctx.save();
        ctx.translate(x + width / 2, y - 10);
        ctx.fillText('Phase', 0, 0);
        ctx.restore();
    }

    // ========== 8. SYSTEM ARCHITECTURE DIAGRAM ==========
    createSystemArchitecture() {
        const canvas = document.createElement('canvas');
        canvas.id = 'systemArchitecture';
        canvas.width = 800;
        canvas.height = 500;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Node A
        this.drawNode(ctx, 150, 250, 'Node A', true);
        
        // Draw Node B
        this.drawNode(ctx, 650, 250, 'Node B', false);

        // Draw communication link
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(230, 250);
        ctx.lineTo(570, 250);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow
        ctx.beginPath();
        ctx.moveTo(565, 245);
        ctx.lineTo(570, 250);
        ctx.lineTo(565, 255);
        ctx.stroke();

        ctx.fillStyle = '#4CAF50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Communication Beam', 400, 240);

        // Draw sensing beams (multiple angles)
        const sensingAngles = [-40, -20, 0, 20, 40];
        sensingAngles.forEach((angle, idx) => {
            const rad = angle * Math.PI / 180;
            const endX = 150 + 200 * Math.cos(rad + Math.PI / 2);
            const endY = 250 - 200 * Math.sin(rad + Math.PI / 2);

            ctx.strokeStyle = `hsl(${idx * 40}, 70%, 50%)`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(150, 250);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
        ctx.setLineDash([]);

        ctx.fillStyle = '#FF9800';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Scanning Beams', 150, 80);

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('JCAS System Architecture', canvas.width / 2, 30);

        // Legend
        this.drawLegend(ctx, 50, 400, [
            { color: '#4CAF50', label: 'Communication' },
            { color: '#FF9800', label: 'Sensing' }
        ]);
    }

    drawNode(ctx, x, y, label, showArrays) {
        // Main node circle
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);

        if (showArrays) {
            // Array 1
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText('Array 1', x - 50, y - 50);
            this.drawMiniArray(ctx, x - 50, y - 35, 8, true);

            // Array 2
            ctx.fillText('Array 2', x + 50, y - 50);
            this.drawMiniArray(ctx, x + 50, y - 35, 8, false);
        }
    }

    drawMiniArray(ctx, x, y, elements, vertical) {
        const spacing = 8;
        
        for (let i = 0; i < elements; i++) {
            const dx = vertical ? 0 : i * spacing - (elements - 1) * spacing / 2;
            const dy = vertical ? i * spacing - (elements - 1) * spacing / 2 : 0;

            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(x + dx, y + dy, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // ========== 9. PARETO FRONT (Multi-objective) ==========
    createParetoFront(population, sensingAngle) {
        const canvas = document.createElement('canvas');
        canvas.id = 'paretoFront';
        canvas.width = 600;
        canvas.height = 600;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const padding = 60;
        const plotWidth = canvas.width - 2 * padding;
        const plotHeight = canvas.height - 2 * padding;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate objectives for each individual
        const objectives = population.map(ind => {
            const commGain = this.calculateBeamGain(ind.commWeights, 0);
            const sensingGain = this.calculateBeamGain(ind.sensingWeights, sensingAngle);
            return { commGain, sensingGain };
        });

        // Find ranges
        const commGains = objectives.map(o => o.commGain);
        const sensingGains = objectives.map(o => o.sensingGain);
        const minComm = Math.min(...commGains);
        const maxComm = Math.max(...commGains);
        const minSens = Math.min(...sensingGains);
        const maxSens = Math.max(...sensingGains);

        // Draw axes
        this.drawCartesianAxes(ctx, padding, plotWidth, plotHeight, 
            minComm, maxComm, minSens, maxSens);

        // Plot points
        objectives.forEach(obj => {
            const x = padding + ((obj.commGain - minComm) / (maxComm - minComm)) * plotWidth;
            const y = padding + plotHeight - ((obj.sensingGain - minSens) / (maxSens - minSens)) * plotHeight;

            ctx.fillStyle = '#2196F3';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('Pareto Front: Communication vs Sensing Trade-off', canvas.width / 2, 30);

        // Axis labels
        ctx.font = '12px Arial';
        ctx.fillText('Communication Beam Gain', canvas.width / 2, canvas.height - 10);
        
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Sensing Beam Gain', 0, 0);
        ctx.restore();
    }

    calculateBeamGain(weights, angle) {
        const M = weights.length;
        const angleRad = angle * Math.PI / 180;
        let response = new Complex(0, 0);

        for (let m = 0; m < M; m++) {
            const phase = Math.PI * m * Math.sin(angleRad);
            const a = Complex.fromPolar(1, phase);
            response = response.add(a.multiply(weights[m].conjugate()));
        }

        return response.magnitude();
    }

    // ========== 10. COMPARISON CHART (SSGA vs Standard GA) ==========
    createAlgorithmComparison(ssgaHistory, standardGAHistory) {
        const canvas = document.createElement('canvas');
        canvas.id = 'algorithmComparison';
        canvas.width = 800;
        canvas.height = 400;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const padding = 60;
        const plotWidth = canvas.width - 2 * padding;
        const plotHeight = canvas.height - 2 * padding;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Combine data for ranges
        const allEvals = [
            ...ssgaHistory.map(h => h.evaluations),
            ...standardGAHistory.map(h => h.evaluations)
        ];
        const allFitness = [
            ...ssgaHistory.map(h => h.best),
            ...standardGAHistory.map(h => h.best)
        ];

        const maxEval = Math.max(...allEvals);
        const maxFit = Math.max(...allFitness);
        const minFit = Math.min(...allFitness);

        // Draw axes
        this.drawCartesianAxes(ctx, padding, plotWidth, plotHeight, 
            0, maxEval, Math.floor(minFit), Math.ceil(maxFit));

        // Plot SSGA
        this.plotConvergenceLine(ctx, padding, plotWidth, plotHeight,
            ssgaHistory.map(h => h.evaluations),
            ssgaHistory.map(h => h.best),
            maxEval, minFit, maxFit, '#2196F3', 3);

        // Plot Standard GA
        this.plotConvergenceLine(ctx, padding, plotWidth, plotHeight,
            standardGAHistory.map(h => h.evaluations),
            standardGAHistory.map(h => h.best),
            maxEval, minFit, maxFit, '#FF5722', 2);

        // Legend
        this.drawLegend(ctx, canvas.width - 180, 60, [
            { color: '#2196F3', label: 'Steady-State GA' },
            { color: '#FF5722', label: 'Standard GA' }
        ]);

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('Algorithm Comparison', canvas.width / 2, 30);

        // Axis labels
        ctx.font = '12px Arial';
        ctx.fillText('Function Evaluations', canvas.width / 2, canvas.height - 10);
        
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Best Fitness', 0, 0);
        ctx.restore();
    }

    // ========== 11. 3D SURFACE PLOT (Power Allocation) ==========
    create3DPowerAllocation(rhoValues, sensingAngles, fitnessMatrix) {
        const canvas = document.createElement('canvas');
        canvas.id = 'powerAllocation3D';
        canvas.width = 700;
        canvas.height = 500;
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 3D projection parameters
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 200;
        const tiltX = 0.5;
        const tiltY = 0.3;

        // Project 3D to 2D
        const project = (x, y, z) => {
            const px = centerX + scale * (x - y * Math.cos(tiltY));
            const py = centerY - scale * (z - x * tiltX - y * Math.sin(tiltY));
            return { x: px, y: py };
        };

        // Normalize data
        const maxFitness = Math.max(...fitnessMatrix.flat());
        const minFitness = Math.min(...fitnessMatrix.flat());

        // Draw surface
        for (let i = 0; i < rhoValues.length - 1; i++) {
            for (let j = 0; j < sensingAngles.length - 1; j++) {
                const x1 = (rhoValues[i] - 0.5) * 2;
                const y1 = (sensingAngles[j] / 90);
                const z1 = (fitnessMatrix[i][j] - minFitness) / (maxFitness - minFitness);

                const x2 = (rhoValues[i + 1] - 0.5) * 2;
                const y2 = (sensingAngles[j + 1] / 90);
                const z2 = (fitnessMatrix[i + 1][j + 1] - minFitness) / (maxFitness - minFitness);

                const p1 = project(x1, y1, z1);
                const p2 = project(x2, y1, z1);
                const p3 = project(x2, y2, z2);
                const p4 = project(x1, y2, z2);

                // Color based on fitness
                const hue = (z1 / 1.0) * 120; // Green to red
                ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.7)`;
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 0.5;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.lineTo(p4.x, p4.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('Fitness vs Power Allocation (ρ) and Sensing Angle', canvas.width / 2, 30);

        // Axis labels
        ctx.font = '12px Arial';
        ctx.fillText('ρ (Power to Comm)', 100, canvas.height - 20);
        ctx.fillText('Sensing Angle', canvas.width - 120, canvas.height - 20);
        ctx.fillText('Fitness', canvas.width - 50, 100);
    }

    // ========== Utility: Clear all visualizations ==========
    clearAll() {
        this.container.innerHTML = '';
        this.charts = {};
    }
}

// ============= DEMO USAGE =============

// HTML setup
document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>JCAS Multibeam Visualization</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        h1 {
            text-align: center;
            color: #333;
        }
        #vizContainer {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        canvas {
            display: block;
            margin: 20px auto;
            border: 1px solid #ddd;
            background: white;
        }
        .section {
            margin: 40px 0;
            padding: 20px 0;
            border-top: 2px solid #eee;
        }
        .section h2 {
            color: #2196F3;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <h1>🎯 JCAS Multibeam Optimization - Visualization Dashboard</h1>
    <div id="vizContainer"></div>
</body>
</html>
`);

// Initialize visualization
const viz = new JCASVisualization('vizContainer');

// Example: Create all visualizations
function createAllVisualizations(optimizationResult, sensingAngle) {
    const { individual, statistics } = optimizationResult;
    
    // Get radiation patterns
    const pattern = getRadiationPattern(individual, sensingAngle);
    const commPattern = getCommRadiationPattern(individual);
    const sensingPattern = getSensingRadiationPattern(individual, sensingAngle);
    
    // Section 1: Antenna Array
    document.getElementById('vizContainer').innerHTML += '<div class="section"><h2>1. Antenna Array Configuration</h2></div>';
    viz.createAntennaArrayLayout(16, 0.5);
    
    // Section 2: Radiation Patterns
    document.getElementById('vizContainer').innerHTML += '<div class="section"><h2>2. Radiation Patterns</h2></div>';
    viz.createRadiationPatternPolar(pattern, `Multibeam Pattern (Sensing: ${sensingAngle}°)`);
    viz.createRadiationPatternCartesian(pattern);
    viz.createMultibeamComparison(commPattern, sensingPattern, pattern);
    
    // Section 3: Beamforming Weights
    document.getElementById('vizContainer').innerHTML += '<div class="section"><h2>3. Beamforming Weights</h2></div>';
    viz.createWeightsVisualization(individual.commWeights, individual.sensingWeights);
    
    // Section 4: Convergence Analysis
    document.getElementById('vizContainer').innerHTML += '<div class="section"><h2>4. Optimization Convergence</h2></div>';
    viz.createConvergencePlot(statistics.fitnessHistory);
    viz.createDiversityPlot(statistics.fitnessHistory);
    
    // Section 5: System Architecture
    document.getElementById('vizContainer').innerHTML += '<div class="section"><h2>5. System Architecture</h2></div>';
    viz.createSystemArchitecture();
}

console.log("Visualization library loaded. Use createAllVisualizations() to generate plots.");