import { isObject } from '../shared'
import { track, trigger } from './effect'
import { reactive, ReactiveFlag, readonly } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)
function createGetter(isReadonly = false, isShallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlag.IS_REACTIVE) {
      return true
    } else if (key === ReactiveFlag.IS_READONLY) {
      return isReadonly
    }
    const res = Reflect.get(target, key)
    if (isShallow) return res
    // 判断 res 是否是 object
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }
    //  收集依赖
    !isReadonly && track(target, key)
    return res
  }
}
function createSetter(_isReadonly = false) {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value)
    // 触发依赖
    trigger(target, key)
    return res
  }
}
export const mutabelHandler = {
  get,
  set,
}
export const readonlyHandler = {
  get: readonlyGet,
  set: (target, key) => {
    console.warn(`key: ${key} 赋值失败，因为目标${target}是只读的`)
    return true
  },
}
export const shallowReadonlyHandler = {
  get: shallowReadonlyGet,
  set: (target, key) => {
    console.warn(`key: ${key} 赋值失败，因为目标${target}是只读的`)
    return true
  },
}
