import { mutabelHandler, readonlyHandler } from './baseHandlers'

// 枚举reactive上的一些标签
export const enum ReactiveFlag {
  IS_REACTIVE = 'is_reactive',
  IS_READONLY = 'is_readonly',
}

export function reactive(raw) {
  return createActiveObject(raw, mutabelHandler)
}

// 拦截set的赋值操作，直接返回成功
export function readonly(raw) {
  return createActiveObject(raw, readonlyHandler)
}

export function isReactive(value) {
  return !!value[ReactiveFlag.IS_REACTIVE]
}
export function isReadonly(value) {
  return !!value[ReactiveFlag.IS_READONLY]
}

function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}
