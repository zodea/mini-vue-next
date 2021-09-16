let activeEffect
class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
  }

  run() {
    activeEffect = this
    this._fn()
  }
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

  // 将当前的更新方法传递到内里
  dep.add(activeEffect)
}

// 触发依赖
export function trigger(target, key) {
  // 首先获取当前目标的依赖
  const depsMap = targetMap.get(target)
  // 获取当前key的方法映射
  const dep = depsMap.get(key)

  // 此时直接执行将内部的方法全部运行
  for (const effect of dep) {
    effect.run()
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}