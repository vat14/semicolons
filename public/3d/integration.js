// integration.js - Connects parent React app to 3D model
// All scan input comes from the parent iframe via handleExternalScan.

class InventoryIntegration {
    constructor() {
        // Expose the external scan handler to the parent React app
        window.handleExternalScan = (item, mode) => {
            console.log('External scan received in 3D Iframe:', item, mode);
            const destination = item.assigned_location || 'WH_1-A-1-1';
            
            if (window.factoryModel) {
                // Choose box color based on mode
                const colorMap = { add: 0x00ffcc, remove: 0xff3333, return: 0xf59e0b };
                const boxColor = colorMap[mode] || 0x00ffcc;

                if (mode === 'remove') {
                    // REMOVE mode: red box spawns at warehouse, travels back to dock, vanishes
                    const box = window.factoryModel.createBox(boxColor, item.id);
                    const childMesh = box.children[0];
                    if (childMesh && childMesh.material) {
                        childMesh.material.transparent = true;
                        childMesh.material.opacity = 1;
                    }
                    window.factoryModel.scene.add(box);
                    window.factoryModel.incomingBoxes.push(box);
                    window.factoryModel.highlightLocation(destination);
                    window.factoryModel.animateBoxFromDestination(box, destination);
                } else {
                    // ADD or RETURN mode: box spawns at dock, travels to warehouse shelf
                    const box = window.factoryModel.createBox(boxColor, item.id);
                    box.position.copy(window.factoryModel.receivingPoint);
                    box.position.y += 0.5;
                    window.factoryModel.scene.add(box);
                    window.factoryModel.incomingBoxes.push(box);
                    window.factoryModel.animateBoxToDestination(box, destination);
                    window.factoryModel.highlightLocation(destination);
                }

                // Update info panel
                const panel = document.getElementById('inventory-info');
                if (panel) {
                    const actionLabels = { add: 'Restocking...', remove: 'Dispatching...', return: 'Processing Return...' };
                    const actionColors = { add: '#00ffcc', remove: '#ff3333', return: '#f59e0b' };
                    panel.innerHTML = `
                        <div class="info-row"><span class="label">Product:</span><span class="value">${item.name || item.id}</span></div>
                        <div class="info-row"><span class="label">Action:</span><span class="value" style="color:${actionColors[mode] || '#00ffcc'}">${actionLabels[mode] || 'Processing...'}</span></div>
                        <div class="info-row"><span class="label">Location:</span><span class="value" style="color: #ffaa00;">${destination}</span></div>
                    `;
                    document.getElementById('info-panel').style.display = 'block';
                }
            }
        };
    }
}

// Initialize after factory model is ready
setTimeout(() => {
    new InventoryIntegration();
}, 1000);