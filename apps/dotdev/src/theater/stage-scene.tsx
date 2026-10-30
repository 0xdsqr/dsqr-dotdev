import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Suspense, useState } from 'react'
import { palette } from './palette'
import { Audience } from './scene/audience'
import { CameraRig, openingShot } from './scene/camera-rig'
import { Hall } from './scene/hall'
import { Piano } from './scene/piano'
import { Speakers } from './scene/speakers'
import { Spotlights } from './scene/spotlights'
import { StageWash } from './scene/stage-wash'
import { TechBooth } from './scene/tech-booth'

export default function StageScene({ reducedMotion }: { reducedMotion: boolean }) {
  const [dpr, setDpr] = useState(1.5)
  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ position: [...openingShot], fov: 40, near: 0.1, far: 160 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.35
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <color attach="background" args={[palette.night]} />
      <fogExp2 attach="fog" args={[palette.haze, 0.014]} />
      <hemisphereLight args={['#5b47a8', '#07040e', 0.9]} />
      <StageWash />
      <CameraRig still={reducedMotion} />
      <Hall />
      <Audience />
      <TechBooth />
      <Speakers />
      <Spotlights />
      <Suspense fallback={null}>
        <Piano />
      </Suspense>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.45} luminanceSmoothing={0.2} />
        <Vignette darkness={0.55} offset={0.3} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
