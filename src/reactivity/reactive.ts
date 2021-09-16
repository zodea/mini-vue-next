import { mutabelHandler, readonlyHandler } from './baseHandlers'

export function reactive(raw) {
  return createActiveObject(raw, mutabelHandler)
}

// 拦截set的赋值操作，直接返回成功
export function readonly(raw) {
  return createActiveObject(raw, readonlyHandler)
}

function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}
