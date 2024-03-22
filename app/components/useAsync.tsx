import { useEffect, DependencyList } from "react";
import useAsyncFn, { FunctionReturningPromise } from "./useAsyncFn";

export function useAsync<T extends FunctionReturningPromise>(
  fn: T,
  deps: DependencyList = []
) {
  const [state, callback] = useAsyncFn(fn, deps, {
    loading: true,
  });

  useEffect(() => {
    callback();
  }, [callback]);

  return state;
}
