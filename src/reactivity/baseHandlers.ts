import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key)
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
