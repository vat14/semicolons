class Factory3DModel {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a14); // Darker background
        
        // Setup camera (Moved back to see the whole complex)
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 45, 70); 
        this.camera.lookAt(0, 0, 0);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2; 
        this.controls.target.set(0, 0, 0);
        
        // Storage
        this.storageLocations = {};
        this.incomingBoxes = [];
        this.receivingPoint = new THREE.Vector3(-60, 0.5, 25); // Central intake dock
        
        this.setupLights();
        this.buildMegaComplex();
        this.addParticleEffects();
        
        this.animate();
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404060, 1.2);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 50, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        const d = 70;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.far = 150;
        this.scene.add(dirLight);
    }
    
    buildMegaComplex() {
        // Expanded Floor for 5 warehouses
        const gridHelper = new THREE.GridHelper(140, 70, 0x88aaff, 0x335588);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);
        
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.8 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 70), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Central Receiving Dock
        this.createReceivingDock(-60, 25);
        
        // The Main Inter-Warehouse Trunk Conveyor (The Highway)
        this.createConveyorBelt(-5, 0.1, 15, 110, 0x555555, Math.PI / 2); // Runs from X=-60 to X=50
        
        // Feeder from Dock to Main Highway
        this.createConveyorBelt(-60, 0.1, 20, 10, 0x555555, 0); 
        
        // Generate the 5 Warehouses
        const warehouseCenters = [-40, -20, 0, 20, 40];
        
        warehouseCenters.forEach((xOffset, index) => {
            const wId = `WH_${index + 1}`;
            this.buildWarehouse(xOffset, 0, wId);
        });
    }

   buildWarehouse(x, z, wId) {
        // Floor
        const wFloorMat = new THREE.MeshStandardMaterial({ color: 0x2a3545, roughness: 0.6 });
        const wFloor = new THREE.Mesh(new THREE.PlaneGeometry(18, 30), wFloorMat);
        wFloor.rotation.x = -Math.PI / 2;
        wFloor.position.set(x, 0.05, z + 1.5); 
        wFloor.receiveShadow = true;
        this.scene.add(wFloor);

        // Transparent Glass Walls
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x446688, 
            transparent: true, 
            opacity: 0.2,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Back Wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 0.5), wallMat);
        backWall.position.set(x, 4, z - 13);
        this.scene.add(backWall);
        
        // Left Wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 30), wallMat);
        leftWall.position.set(x - 9, 4, z + 1.5);
        this.scene.add(leftWall);
        
        // Right Wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 30), wallMat);
        rightWall.position.set(x + 9, 4, z + 1.5);
        this.scene.add(rightWall);

        // FRONT WALL (Split into 3 pieces to create a Bay Door for the conveyor)
        const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 0.5), wallMat);
        frontWallLeft.position.set(x - 5.5, 4, z + 16);
        this.scene.add(frontWallLeft);
        
        const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 0.5), wallMat);
        frontWallRight.position.set(x + 5.5, 4, z + 16);
        this.scene.add(frontWallRight);

        const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.5), wallMat);
        frontWallTop.position.set(x, 6, z + 16);
        this.scene.add(frontWallTop);

        // FIXED: Internal Central Conveyor Belt
        // Math.PI / 2 perfectly rotates it to run deep into the warehouse along the Z-axis
        this.createConveyorBelt(x, 0.1, 1.5, 27, 0x444444, Math.PI / 2); 

        // Racks (Shifted to make room for the central belt)
        this.createStorageRack(x - 6, z + 5, 3, 0x4477aa, `${wId}-A`);
        this.createStorageRack(x + 6, z + 5, 3, 0x44aa77, `${wId}-B`);
        this.createStorageRack(x - 6, z - 5, 3, 0xaa7744, `${wId}-C`);
        this.createStorageRack(x + 6, z - 5, 3, 0x8866aa, `${wId}-D`);
        this.createStorageRack(x - 6, z - 11, 3, 0x66aaff, `${wId}-E`);
        this.createStorageRack(x + 6, z - 11, 3, 0xffaa66, `${wId}-F`);
        
        // Sector Label
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00aaff';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`${wId} Sector`, 50, 40);
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(x, 9, z - 13);
        sprite.scale.set(12, 3, 1);
        this.scene.add(sprite);
    }
    // (Keep your existing createStorageRack, createReceivingDock, createConveyorBelt, createBox, addParticleEffects methods here unchanged)
    
    // I am omitting the raw mesh building code for brevity as it is unchanged, 
    // PASTE YOUR EXISTING createStorageRack to addParticleEffects functions HERE.

    createStorageRack(x, z, levels, color, prefix) {
        const rackGroup = new THREE.Group();
        const rackWidth = 3;
        const rackDepth = 1.5;
        const rackHeight = 4;
        
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        
        for (let i = -1; i <= 1; i+=2) {
            for (let j = -1; j <= 1; j+=2) {
                const support = new THREE.Mesh(new THREE.BoxGeometry(0.2, rackHeight, 0.2), frameMat);
                support.position.set(i * rackWidth/2, rackHeight/2, j * rackDepth/2);
                support.castShadow = true;
                rackGroup.add(support);
            }
        }
        
        const shelfMat = new THREE.MeshStandardMaterial({ color: color });
        for (let level = 1; level <= levels; level++) {
            const shelfY = level * 1.2 - 0.6;
            const platform = new THREE.Mesh(new THREE.BoxGeometry(rackWidth - 0.4, 0.1, rackDepth - 0.4), shelfMat);
            platform.position.set(0, shelfY, 0);
            platform.castShadow = true;
            rackGroup.add(platform);
            
            for (let slot = 0; slot < 3; slot++) {
                const slotX = (slot - 1) * 0.8;
                const slotId = `${prefix}-${level}-${slot}`;
                
                const slotMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x112233 });
                const slotMarker = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), slotMat);
                slotMarker.position.set(slotX, shelfY + 0.15, 0);
                slotMarker.userData = { type: 'storage', id: slotId };
                rackGroup.add(slotMarker);
                
                this.storageLocations[slotId] = slotMarker;
            }
        }
        rackGroup.position.set(x, 0, z);
        this.scene.add(rackGroup);
    }

    createReceivingDock(x, z) {
        const dockGroup = new THREE.Group();
        const platform = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x888888 }));
        platform.position.set(0, 0.15, 0);
        dockGroup.add(platform);
        
        const sign = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 0.1), new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x331100 }));
        sign.position.set(0, 4, 2);
        dockGroup.add(sign);
        
        dockGroup.position.set(x, 0, z);
        this.scene.add(dockGroup);
    }

    createConveyorBelt(x, y, z, length, color, rotation = 0) {
        const beltGroup = new THREE.Group();
        const belt = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        belt.position.set(0, 0.05, 0);
        beltGroup.add(belt);
        
        beltGroup.position.set(x, y, z);
        beltGroup.rotation.y = rotation;
        this.scene.add(beltGroup);
    }

    createBox(color = 0xff6600, id = null) {
        const boxGroup = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: color }));
        box.position.set(0, 0.4, 0);
        boxGroup.add(box);
        
        boxGroup.userData = { id: id || `BOX-${Math.floor(Math.random()*1000)}`, arrived: false };
        return boxGroup;
    }

    addParticleEffects() {
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(500 * 3);
        for (let i = 0; i < 1500; i += 3) {
            positions[i] = (Math.random() - 0.5) * 120;
            positions[i+1] = Math.random() * 15;
            positions[i+2] = (Math.random() - 0.5) * 60;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({ color: 0x88aaff, size: 0.05, transparent: true, opacity: 0.2 });
        this.scene.add(new THREE.Points(particleGeo, particleMat));
    }

    addIncomingBox(barcodeData) {
        const box = this.createBox(0x00ffcc, barcodeData.id); // Neon box for high visibility
        box.position.copy(this.receivingPoint);
        box.position.y += 0.5;
        this.scene.add(box);
        this.incomingBoxes.push(box);
        
        if (barcodeData.destination) {
            this.animateBoxToDestination(box, barcodeData.destination);
            this.highlightLocation(barcodeData.destination);
        }
    }
    
    animateBoxToDestination(box, destinationId) {
        const destination = this.storageLocations[destinationId];
        if (!destination) return;
        
        const destPos = destination.getWorldPosition(new THREE.Vector3());
        destPos.y += 0.8; 
        
        const startPos = box.position.clone();
        const centralX = Math.round(destPos.x / 20) * 20; // Perfect warehouse center
        
        const waypoints = [
            startPos.clone(),                                      // 0: Dock (-60, y, 25)
            new THREE.Vector3(-60, startPos.y, 15),                // 1: Enter main highway
            new THREE.Vector3(centralX, startPos.y, 15),           // 2: Travel highway to specific bay door
            new THREE.Vector3(centralX, startPos.y, destPos.z),    // 3: Enter warehouse on branch belt
            destPos.clone()                                        // 4: Lateral lift to shelf
        ];
        
        const durations = [
            1000,                                                  
            Math.max(1000, Math.abs(centralX - (-60)) * 60),       
            Math.max(1000, Math.abs(destPos.z - 15) * 60),         
            1500                                                   
        ];
        
        let currentSegment = 0;
        let segmentStartTime = Date.now();
        
        const animate = () => {
            if (currentSegment >= waypoints.length - 1) {
                box.position.copy(destPos);
                box.rotation.y = 0; // Reset rotation on shelf
                box.userData.arrived = true;
                this.showInventoryInfo(destinationId, 'add');
                return;
            }
            
            const wpStart = waypoints[currentSegment];
            const wpEnd = waypoints[currentSegment + 1];
            const elapsed = Date.now() - segmentStartTime;
            let progress = Math.min(elapsed / durations[currentSegment], 1);
            
            if (progress >= 1) {
                currentSegment++;
                segmentStartTime = Date.now();
                requestAnimationFrame(animate);
                return;
            }
            
            // Belt Travel Phases
            if (currentSegment < 3) {
                box.position.x = wpStart.x + (wpEnd.x - wpStart.x) * progress;
                box.position.z = wpStart.z + (wpEnd.z - wpStart.z) * progress;
                box.position.y = wpStart.y + (Math.sin(Date.now() * 0.05) * 0.02); // Rattle
                
                // Box Rotation (Face direction of travel)
                if (currentSegment === 0) box.rotation.y = 0;                           // Moving -Z
                else if (currentSegment === 1) box.rotation.y = -Math.PI / 2;           // Moving +X
                else if (currentSegment === 2) box.rotation.y = 0;                      // Moving -Z into warehouse
            } 
            // Final Robotic Lift Phase
            else {
                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                box.position.x = wpStart.x + (wpEnd.x - wpStart.x) * ease;
                box.position.z = wpStart.z + (wpEnd.z - wpStart.z) * ease;
                box.position.y = wpStart.y + (wpEnd.y - wpStart.y) * ease + (Math.sin(progress * Math.PI) * 2);
                
                // Spin while lifting to align with shelf
                box.rotation.y = ease * Math.PI; 
            }
            
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // REVERSE animation: box leaves warehouse shelf, travels back to dock, then disappears
    animateBoxFromDestination(box, destinationId) {
        const destination = this.storageLocations[destinationId];
        if (!destination) {
            // If location not found, just fade and remove
            this.fadeAndRemoveBox(box);
            return;
        }

        const shelfPos = destination.getWorldPosition(new THREE.Vector3());
        shelfPos.y += 0.8;

        // Start the box at the shelf
        box.position.copy(shelfPos);

        const dockPos = this.receivingPoint.clone();
        dockPos.y += 0.5;
        const centralX = Math.round(shelfPos.x / 20) * 20;

        // Reverse waypoints: shelf → warehouse floor → highway → dock entrance → dock
        const waypoints = [
            shelfPos.clone(),                                           // 0: Shelf
            new THREE.Vector3(centralX, dockPos.y, shelfPos.z),         // 1: Lower from shelf (robotic arm down)
            new THREE.Vector3(centralX, dockPos.y, 15),                 // 2: Exit warehouse onto highway
            new THREE.Vector3(-60, dockPos.y, 15),                      // 3: Travel highway back
            dockPos.clone()                                             // 4: Arrive at dock
        ];

        const durations = [
            1500,                                                       // Robotic arm descent
            Math.max(1000, Math.abs(shelfPos.z - 15) * 60),            // Exit warehouse
            Math.max(1000, Math.abs(centralX - (-60)) * 60),           // Highway travel
            1000                                                        // Enter dock
        ];

        let currentSegment = 0;
        let segmentStartTime = Date.now();
        const self = this;

        const animate = () => {
            if (currentSegment >= waypoints.length - 1) {
                box.position.copy(dockPos);
                box.userData.arrived = true;
                self.showInventoryInfo(destinationId, 'remove');
                // Fade out and remove at dock
                self.fadeAndRemoveBox(box);
                return;
            }

            const wpStart = waypoints[currentSegment];
            const wpEnd = waypoints[currentSegment + 1];
            const elapsed = Date.now() - segmentStartTime;
            let progress = Math.min(elapsed / durations[currentSegment], 1);

            if (progress >= 1) {
                currentSegment++;
                segmentStartTime = Date.now();
                requestAnimationFrame(animate);
                return;
            }

            // Phase 0: Robotic arm descent from shelf
            if (currentSegment === 0) {
                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                box.position.x = wpStart.x + (wpEnd.x - wpStart.x) * ease;
                box.position.z = wpStart.z + (wpEnd.z - wpStart.z) * ease;
                box.position.y = wpStart.y + (wpEnd.y - wpStart.y) * ease + (Math.sin(progress * Math.PI) * 2);
                box.rotation.y = ease * Math.PI;
            }
            // Phases 1-3: Belt travel (reverse direction)
            else {
                box.position.x = wpStart.x + (wpEnd.x - wpStart.x) * progress;
                box.position.z = wpStart.z + (wpEnd.z - wpStart.z) * progress;
                box.position.y = wpStart.y + (Math.sin(Date.now() * 0.05) * 0.02); // Rattle

                // Face direction of travel (reversed)
                if (currentSegment === 1) box.rotation.y = Math.PI;             // Moving +Z out of warehouse
                else if (currentSegment === 2) box.rotation.y = Math.PI / 2;    // Moving -X on highway
                else if (currentSegment === 3) box.rotation.y = Math.PI;        // Moving +Z to dock
            }

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // Shrink + fade a box and remove it from the scene
    fadeAndRemoveBox(box) {
        const startTime = Date.now();
        const duration = 800;
        const self = this;

        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const scale = 1 - progress;
            box.scale.set(scale, scale, scale);
            // Fade all child meshes
            box.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 1 - progress;
                }
            });

            if (progress >= 1) {
                self.scene.remove(box);
                self.incomingBoxes = self.incomingBoxes.filter(b => b !== box);
                return;
            }
            requestAnimationFrame(fade);
        };
        requestAnimationFrame(fade);
    }
    
    // (Keep your existing highlightLocation, showInventoryInfo, onWindowResize, and animate methods here unchanged)
    
    highlightLocation(locationId) {
        Object.values(this.storageLocations).forEach(loc => {
            if (loc.material) loc.material.emissive.setHex(0x112233);
        });
        const target = this.storageLocations[locationId];
        if (target && target.material) target.material.emissive.setHex(0x00ffcc);
    }
    
    showInventoryInfo(locationId, mode) {
        const statusColor = mode === 'remove' ? '#ff3333' : '#00ffcc';
        const statusText = mode === 'remove' ? 'Dispatched' : 'Restocked';
        document.getElementById('inventory-info').innerHTML = `
            <div class="info-row"><span class="label">Location:</span><span class="value">${locationId}</span></div>
            <div class="info-row"><span class="label">Status:</span><span class="value" style="color:${statusColor}">${statusText}</span></div>
        `;
        document.getElementById('info-panel').style.display = 'block';
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.incomingBoxes.forEach(box => { if (!box.userData.arrived) box.rotation.y += 0.01; });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('load', () => { window.factoryModel = new Factory3DModel(); });