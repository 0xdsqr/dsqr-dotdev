import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { type RefObject, Suspense, useState } from 'react'
import { Speakers } from './audio/speakers'
import { TechBooth } from './booth/tech-booth'
import { type CameraApi, CameraDirector } from './camera/camera-director'
import { openingShot } from './camera/shots'
import { Audience } from './crowd/audience'
import { palette } from './lib/palette'
import { Spotlights } from './lighting/spotlights'
import { StageWash } from './lighting/stage-wash'
import { Piano } from './piano/piano'
import { SideScreens } from './screens/side-screens'
import { Hall } from './venue/hall'

export type StageSceneProps = {
  reducedMotion: boolean
  camera: RefObject<CameraApi | null>
  onMovedChange: (moved: boolean) => void
}

export default function StageScene({ reducedMotion, camera, onMovedChange }: StageSceneProps) {
  const [dpr, setDpr] = useState(1.5)
  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ position: [...openingShot.position], fov: 40, near: 0.1, far: 160 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.35
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <color attach="background" args={[palette.night]} />
      <fogExp2 attach="fog" args={[palette.haze, 0.014]} />
      <hemisphereLight args={['#5b47a8', '#07040e', 0.9]} />
      <CameraDirector still={reducedMotion} api={camera} onMovedChange={onMovedChange} />
      <StageWash />
      <Hall />
      <Audience />
      <TechBooth />
      <Speakers />
      <Spotlights />
      <Suspense fallback={null}>
        <Piano />
      </Suspense>
      <SideScreens still={reducedMotion} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.45} luminanceSmoothing={0.2} />
        <Vignette darkness={0.55} offset={0.3} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
