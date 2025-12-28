<script lang="ts">
  import { type SuperForm, type SuperValidated } from "sveltekit-superforms";
  import ArticleEditor from "../ArticleEditor.svelte";
  import type { PageData } from "./$types";
  import { type ArticleSchema } from "$lib/news/schema";
  import { Label } from "$lib/components/ui/label";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Input } from "$lib/components/ui/input";
  import { superForm } from "$lib/utils/client/superForms";
  import Pen from "@lucide/svelte/icons/pen";
  import * as m from "$paraglide/messages";

  let { data }: { data: PageData } = $props();

  const superform = superForm(data.form, {
    dataType: "json",
    id: "createpage",
  });

  let { form } = superform;
</script>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form as unknown as SuperValidated<ArticleSchema>}
  superform={superform as unknown as SuperForm<ArticleSchema>}
>
  {#snippet formEnd()}
    <div class="flex w-full flex-col gap-1.5">
      <Label for="sendNotification">{m.news_notification_send()}</Label
      ><Checkbox
        bind:checked={$form.sendNotification}
        id="sendNotification"
        name="sendNotification"
        class="p-2"
      />
    </div>
    <div class="flex w-full flex-col gap-1.5">
      <Label for="notificationText">{m.news_notification_text()}</Label><Input
        bind:value={$form.notificationText}
        type="text"
        id="notificationText"
        name="notificationText"
        placeholder="Notistext"><Pen /></Input
      >
      <span class="text-xs">{m.news_notification_explanation()}</span>
    </div>{/snippet}</ArticleEditor
>
