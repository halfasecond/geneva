/**
 * VECH ship holo — ring icon in the cockpit camera + async GLB load with holo material overrides.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { COLORS, VECH } from '../config'

export interface VechHoloIcon {
  shipIcon: THREE.Group
  iconRing: THREE.Line
}

/** Attach the cyan ring + point light that frames the VECH holo preview in the lower-right radar area. */
export function createVechHoloIcon(camera: THREE.PerspectiveCamera): VechHoloIcon {
  const shipIcon = new THREE.Group()
  camera.add(shipIcon)
  shipIcon.position.set(VECH.groupPos.x, VECH.groupPos.y, VECH.groupPos.z)

  const iconRing = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: VECH.ring.segments }, (_, i) => {
        const a = (i / VECH.ring.segments) * Math.PI * 2
        return new THREE.Vector3(
          Math.cos(a) * VECH.ring.r,
          Math.sin(a) * VECH.ring.ry,
          0
        )
      })
    ),
    new THREE.LineBasicMaterial({ color: COLORS.vechRing, transparent: true, opacity: 0.85 })
  )
  shipIcon.add(iconRing)

  const shipLight = new THREE.PointLight(VECH.light.color, VECH.light.intensity, VECH.light.distance)
  shipLight.position.set(VECH.light.pos.x, VECH.light.pos.y, VECH.light.pos.z)
  shipIcon.add(shipLight)

  return { shipIcon, iconRing }
}

function applyVechHoloMaterial(model: THREE.Object3D) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return
    const mat = (Array.isArray(child.material) ? child.material[0] : child.material).clone()
    if ('emissive' in mat && mat.emissive !== undefined) {
      mat.emissive = new THREE.Color(VECH.emissive)
      mat.emissiveIntensity = VECH.emissiveIntensity
    }
    mat.transparent = true
    mat.opacity = VECH.opacity
    mat.side = THREE.DoubleSide
    mat.depthWrite = false
    child.material = mat
    child.frustumCulled = false
  })
}

function fitVechModel(model: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  model.position.sub(center)

  const sizeBox = new THREE.Box3().setFromObject(model)
  const size = sizeBox.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const autoScale = VECH.targetSize / maxDim
  model.scale.set(autoScale, autoScale, autoScale)

  model.rotation.set(VECH.modelRot.x, VECH.modelRot.y, VECH.modelRot.z)
  model.position.z = VECH.modelZ
}

/** Load a VECH ship GLB, apply holo styling, and parent it under the cockpit holo ring. */
export function loadVechShipModel(glbUrl: string, shipIcon: THREE.Group): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader()
    gltfLoader.load(
      glbUrl,
      (gltf) => {
        const model = gltf.scene
        fitVechModel(model)
        applyVechHoloMaterial(model)

        shipIcon.add(model)
        model.renderOrder = 10
        shipIcon.renderOrder = 10
        model.visible = true
        shipIcon.visible = true

        resolve(model)
      },
      undefined,
      (error) => {
        console.error('Failed to load VECH ship GLB model (no fallback):', error)
        reject(error)
      }
    )
  })
}