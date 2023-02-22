import { useEffect } from 'react'

import { usePrevious } from './usePrevious'

type UseEffectDebugger = (effectHook: any, dependencies: any, dependencyNames?: any[]) => void

export const useEffectDebugger: UseEffectDebugger = (effectHook, dependencies, dependencyNames = []) => {
  const previousDeps = usePrevious(dependencies, [])

  const changedDeps = dependencies.reduce((accum: any, dependency: string, index: number) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency,
        },
      }
    }

    return accum
  }, {})

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps)
  }

  useEffect(effectHook, dependencies)
}
