import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce function calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a");
    debounced("b");
    debounced("c");

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("should support cancel", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a");
    vi.advanceTimersByTime(50);
    debounced.cancel();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
  });

  it("should support flush", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a");
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1); // Not called again
  });
});
