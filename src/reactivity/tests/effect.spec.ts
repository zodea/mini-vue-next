import { effect, stop } from '../effect'
import { reactive } from '../reactive'

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    })

    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })

    expect(nextAge).toBe(11)

    // update
    user.age++
    expect(nextAge).toBe(12)
  })

  it('should return runner when call effect', () => {
    // effect 函数返回一个回调方法，执行effect时会调用回调方法，回调方法执行后会有一个返回值出来

    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo'
    })

    expect(foo).toBe(11)
    const r = runner()
    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })

  it('scheduler', () => {
    // 通过给定effect 第二个参数 scheduler 一个fn
    // 此时当effect在 初次执行时会触发一次fn
    // 在响应式对象obj 触发setter时，不会触发fn，而是scheduler
    // 当触发了runner时，才会去执行fn
    let dummy
    let run
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)
    run()
    expect(dummy).toBe(2)
  })

  it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    // 获取到当前的响应式方法，并对其触发暂停更新的操作
    stop(runner)
    // obj.prop = 3
    // obj.prop = obj.prop + 1
    // 此时会触发get合set操作，所以当stop清理的时候，要再get时做判断
    // 判断当前是否需要做收集，此处的全局变量再哪做赋值呢
    // 由于触发响应式对象赋值的函数是runner，而runner是在run的时候触发的
    // 所以我们在run函数内处理该全局变量的逻辑
    obj.prop++
    expect(dummy).toBe(2)

    runner()
    expect(dummy).toBe(3)
  })

  it('onStop', () => {
    const onStop = jest.fn()
    const runner = effect(() => {}, { onStop })
    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})
