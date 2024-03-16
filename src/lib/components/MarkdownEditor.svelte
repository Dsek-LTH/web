<script lang="ts">
  import { Tipex } from "@friendofsvelte/tipex";
  import "@friendofsvelte/tipex/styles/Tipex.css";
  import "@friendofsvelte/tipex/styles/ProseMirror.css";
  import "@friendofsvelte/tipex/styles/Controls.css";
  import "@friendofsvelte/tipex/styles/EditLink.css";
  import "@friendofsvelte/tipex/styles/CodeBlock.css";
  export let value: string;
</script>

<Tipex
  displayDefaultControls
  floatingMenu
  className="h-[70vh] !border !bg-transparent !input-bordered dark"
  htmlContent={value}
  onEditorUpdate={(event) => {
    value = event.editor["getHTML"]();
  }}
/>
