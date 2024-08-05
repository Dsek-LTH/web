<div
  role="tablist"
  class="tabs-boxed tabs relative -mx-4 overflow-hidden p-4 shadow"
>
  <input
    type="radio"
    name="tabs"
    role="tab"
    class="tab px-8"
    aria-label="SV"
    checked
  />
  <div role="tabpanel" class="tab-content">
    <slot name="sv" />
  </div>
  <input type="radio" name="tabs" role="tab" class="tab px-8" aria-label="EN" />
  <div role="tabpanel" class="tab-content">
    <slot name="en" />
  </div>
</div>
