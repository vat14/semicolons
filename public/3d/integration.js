// integration.js - Connects UI to 3D model
class InventoryIntegration {
    constructor() {
        this.setupEventListeners();
        this.mockProducts = {
            'PROD-001': { name: 'Wireless Headphones', sku: 'WH-1000', demand: 'high', category: 'electronics' },
            'PROD-002': { name: 'Coffee Maker', sku: 'CM-200', demand: 'medium', category: 'appliances' },
            'PROD-003': { name: 'Yoga Mat', sku: 'YM-300', demand: 'high', category: 'fitness' },
            'PROD-004': { name: 'Desk Lamp', sku: 'DL-400', demand: 'low', category: 'furniture' },
            'PROD-005': { name: 'Backpack', sku: 'BP-500', demand: 'medium', category: 'accessories' }
        };
    }
    
    setupEventListeners() {
        // Manual scan button
        document.getElementById('scan-button').addEventListener('click', () => {
            const barcode = document.getElementById('scan-input').value;
            this.processBarcode(barcode);
        });
        
        // Enter key in input
        document.getElementById('scan-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processBarcode(e.target.value);
            }
        });

        // Expose to parent React app
        window.handleExternalScan = (item, mode) => {
            console.log('External scan received in 3D Iframe:', item, mode);
            const destination = item.assigned_location || 'WH_1-A-1-1';
            
            if (window.factoryModel) {
                // If taking out, use red box, otherwise cyan
                const boxColor = mode === 'remove' ? 0xff3333 : 0x00ffcc;
                
                // Add the incoming/outgoing box animation
                const box = window.factoryModel.createBox(boxColor, item.id);
                box.position.copy(window.factoryModel.receivingPoint);
                box.position.y += 0.5;
                window.factoryModel.scene.add(box);
                window.factoryModel.incomingBoxes.push(box);
                
                window.factoryModel.animateBoxToDestination(box, destination);
                window.factoryModel.highlightLocation(destination);
                
                // Update info panel
                const panel = document.getElementById('inventory-info');
                panel.innerHTML = `
                    <div class="info-row"><span class="label">Product:</span><span class="value">${item.name || item.id}</span></div>
                    <div class="info-row"><span class="label">Action:</span><span class="value" style="color:${mode === 'remove' ? '#ff3333' : '#00ffcc'}">${mode === 'add' ? 'Restocked' : 'Dispatched'}</span></div>
                    <div class="info-row"><span class="label">Location:</span><span class="value" style="color: #ffaa00;">${destination}</span></div>
                `;
                document.getElementById('info-panel').style.display = 'block';
            }
        };
    }
    
    processBarcode(barcode) {
        console.log('Processing barcode:', barcode);
        
        // Mock product lookup
        const product = this.mockProducts[barcode] || this.mockProducts['PROD-001'];
        
        // Mock ML prediction based on product category
        const locationPrediction = this.predictLocation(product);
        
        // Trigger 3D animation
        if (window.factoryModel) {
            window.factoryModel.addIncomingBox({
                id: barcode,
                product: product,
                destination: locationPrediction.optimalLocation
            });
        }
        
        // Update info panel
        this.updateInfoPanel(product, locationPrediction);
    }
    
   predictLocation(product) {
        // Updated for 5 Warehouses (WH_1 through WH_5)
        const warehouses = ['WH_1', 'WH_2', 'WH_3', 'WH_4', 'WH_5'];
        const demandZones = {
            'high': ['A-1-1', 'A-2-1', 'B-1-1'],   // Front racks
            'medium': ['C-1-1', 'C-2-1', 'D-1-1'], // Middle racks
            'low': ['E-1-1', 'F-1-1']              // Back racks
        };
        
        const demand = product.demand || 'medium';
        const possibleZones = demandZones[demand] || demandZones['medium'];
        
        // Randomly assign a warehouse and a rack slot
        const targetWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
        const targetSlot = possibleZones[Math.floor(Math.random() * possibleZones.length)];
        
        const optimalLocation = `${targetWarehouse}-${targetSlot}`;
        
        const month = new Date().getMonth();
        const seasonalFactor = (month >= 10 || month <= 1) ? 1.5 : 1.0; 
        
        return {
            optimalLocation: optimalLocation,
            recommendedStock: Math.floor((Math.random() * 50) + 20) * seasonalFactor,
            turnover: demand,
            seasonalFactor: seasonalFactor,
            confidence: 0.85 + (Math.random() * 0.1)
        };
    }
    
    updateInfoPanel(product, prediction) {
        const panel = document.getElementById('inventory-info');
        
        panel.innerHTML = `
            <div class="info-row">
                <span class="label">Product:</span>
                <span class="value">${product.name}</span>
            </div>
            <div class="info-row">
                <span class="label">SKU:</span>
                <span class="value">${product.sku}</span>
            </div>
            <div class="info-row">
                <span class="label">Destination:</span>
                <span class="value" style="color: #ffaa00;">${prediction.optimalLocation}</span>
            </div>
            <div class="info-row">
                <span class="label">AI Confidence:</span>
                <span class="value">${(prediction.confidence * 100).toFixed(1)}%</span>
            </div>
            <div class="info-row">
                <span class="label">Recommended Stock:</span>
                <span class="value">${prediction.recommendedStock} units</span>
            </div>
            <div class="info-row">
                <span class="label">Turnover:</span>
                <span class="value">${prediction.turnover}</span>
            </div>
            <div class="info-row">
                <span class="label">Seasonal Factor:</span>
                <span class="value">${prediction.seasonalFactor}x</span>
            </div>
        `;
        
        document.getElementById('info-panel').style.display = 'block';
    }
}

// Initialize after factory model is ready
setTimeout(() => {
    new InventoryIntegration();
}, 1000);