import { extend } from '../shared'

let activeEffect
class ReactiveEffect {
  private _fn: any
  deps = []
  active = true
  onStop?: () => void
  constructor(fn, public scheduler?) {
    this._fn = fn
  }

  run() {
    activeEffect = this
    return this._fn()
  }

  // 这里需要获取到收集的dep， 在track内作反向收集
  stop() {
    // 优化，当active存在时再调用清理的循环
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect)
  })
}

let targetMap = new WeakMap()
// 收集依赖，先获取当前目标是否已经有依赖更新函数，创建一个全局的目标字典
// 获取effect内拿到的fn， 因此需要将fn提升到外部进行获取
export function track(target, key) {
  // 先获取当前的目标是否存在在字典内
  let depsMap = targetMap.get(target)
  //  初始化
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  // 此时再获取当前字典是否存在相关的key的方法
  let dep = depsMap.get(key)
  // 初始化
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  // 如果没有触发effect，则不用执行后续的代码
  if (!activeEffect) return
  // 将当前的更新方法传递到内里
  dep.add(activeEffect)
  // 此时让 activeEffect 获取到收集的dep
  activeEffect.deps.push(dep)
}

// 触发依赖
export function trigger(target, key) {
  // 首先获取当前目标的依赖
  const depsMap = targetMap.get(target)
  // 获取当前key的方法映射
  const dep = depsMap.get(key)

  // 此时直接执行将内部的方法全部运行
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // 将传递进来的参数都添加到_effecr对象内
  extend(_effect, options)
  _effect.run()

  // 解决run内部的this指向问题
  const runner: any = _effect.run.bind(_effect)

  // 是的stop能找到当前的effect实例
  runner.effect = _effect
  return runner
}

export function stop(runner) {
  runner.effect.stop()
}
