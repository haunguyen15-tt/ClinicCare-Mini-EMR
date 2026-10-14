import type { WatchSource } from 'vue'

/**
 * A copy of `source` that only updates once `source` has stopped changing for `delay` ms.
 * `const debouncedQuery = useDebounce(query, 300)`
 */
export function useDebounce<T>(source: WatchSource<T>, delay = 300): Readonly<Ref<T>> {
  const debounced = shallowRef(toValue(source))
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => clearTimeout(timer))

  return debounced
}
