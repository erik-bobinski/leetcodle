type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

// Enhanced tryCatch that catches both sync and async errors by taking in a function definition
export async function tryCatchSync<T, E = Error>(
  asyncFn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await asyncFn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}
