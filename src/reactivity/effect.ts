import { extend } from "../shared"

const targetMap = new WeakMap()
let activeEffect: any
let shouldTrack

class ReactiveEffect {
  private _fn: any
  deps: any[] = []
  active = true
  onStop?: () => void
  public scheduler: Function | undefined
  constructor(fn, scheduler?: Function) {
    this._fn = fn
    this.scheduler = scheduler
  }

  run() {
    // 当运行stop之后，就不会关心依赖了
    // 所以直接返回响应函数即可
    if (!this.active) {
      return this._fn()
    }
    // 否则的话收集依赖
    shouldTrack = true
    activeEffect = this
    const result = this._fn()
    // 之后再将依赖收集关闭
    // 后续多次调用stop也不会产生影响，在stop内操作也可以
    shouldTrack = false
    return result
  }

  stop() {
    // 此处需要对deps进行解绑
    // 在收集依赖时，将deps绑定在其自身即可
    // 新增一个deps属性进行存储
    this.active && cleanupEffect(this)
    this.onStop?.()
    this.active = false
  }
}

function cleanupEffect(effect: ReactiveEffect) {
  effect.deps.forEach(dep => {
    if (dep) {
      dep.delete(effect)
    }
  })
  effect.deps.length = 0
}

export function effect(fn, options: any = {}) {
  // 获取一个方法，并且需要立即调用
  // 抽离出来，放到一个单独的类中
  const _effect = new ReactiveEffect(fn, options.scheduler)
  extend(_effect, options)
  _effect.run()

  // 获取到的返回值为当前的run方法， 但是需要指定其this的指向
  // 直接返回fn会导致无法收集到对应的依赖
  const runner: any = _effect.run.bind(_effect)

  // 给runner自身添加一个属性，用来记录当前的effect
  runner.effect = _effect
  return runner
}

export function track(target, key) {
  if (!isTracking()) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  if (dep.has(activeEffect)) return

  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const dep = depsMap.get(key)
  for (const effect of dep) {
    // 当执行赋值操作时，会判断是否存在schedule进行执行
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

export function stop(runner) {
  runner.effect.stop()
}
