<script lang="ts">
  export let currentPage = "";
</script>

<div>
  <ul style="list-style: none;">
    <a href="/admin/stocklist" style="margin-right:15px">
      <button
        class="btn btn-primary"
        class:btn-outline={currentPage !== "overview"}
      >
        Överblick
      </button>
    </a>
    <a href="/admin/stocklist/showproducts" style="margin-right:15px">
      <button
        class="btn btn-primary"
        class:btn-outline={currentPage !== "showproducts"}
      >
        Produkter
      </button>
    </a>
    <a href="/admin/stocklist/stockchange" style="margin-right:15px">
      <button
        class="btn btn-primary"
        class:btn-outline={currentPage !== "stockchange"}
      >
        Skriv in/ut
      </button>
    </a>
    <a href="/admin/stocklist/treasury" style="margin-right:15px">
      <button
        class="btn btn-primary"
        class:btn-outline={currentPage !== "treasury"}
      >
        Loggar
      </button>
    </a>
  </ul>
</div>
