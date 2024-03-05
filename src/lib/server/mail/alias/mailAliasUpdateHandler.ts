const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

class MailAliasUpdateHandler {
  private _lastTimeSince: number;
  private _prevResponse: string | null;
  private _hasReceivedUpdate: boolean;

  constructor() {
    this._lastTimeSince = Date.now();
    this._prevResponse = null;
    this._hasReceivedUpdate = false;
  }

  public get cacheDuration(): number {
    return CACHE_DURATION;
  }

  public get hasReceivedUpdate(): boolean {
    return this._hasReceivedUpdate;
  }

  public set hasReceivedUpdate(value: boolean) {
    this._hasReceivedUpdate = value;
  }

  public get prevResponse(): string | null {
    return this._prevResponse;
  }

  public set prevResponse(value: string | null) {
    this._lastTimeSince = Date.now();
    this._prevResponse = value;
  }

  public get lastTimeSince(): number {
    return this._lastTimeSince;
  }

  public set lastTimeSince(value: number) {
    this._lastTimeSince = value;
  }

  public handleUpdate() {
    this._hasReceivedUpdate = true;
  }
}

export const mailAliasUpdateHandler = new MailAliasUpdateHandler();
