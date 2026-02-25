<script lang="ts">
	import FormCheckbox from "$lib/components/forms/FormCheckbox.svelte";
	import FormInput from "$lib/components/forms/FormInput.svelte";
	import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
	import { superForm } from "$lib/utils/client/superForms";
	import * as m from "$paraglide/messages";
	import type { SuperForm, SuperValidated } from "sveltekit-superforms";
	import ArticleEditor from "../ArticleEditor.svelte";
	import type { ArticleSchema } from "$lib/news/schema";
	import FormDateInput from "$lib/components/forms/FormDateInput.svelte";

	export let data;

	const superform = superForm(data.form, {
		dataType: "json",
	});
	$: form = data.form as unknown as SuperValidated<ArticleSchema>;
	$: superformCorrectType = superform as unknown as SuperForm<ArticleSchema>;
</script>

<SetPageTitle title={m.news_createArticle()} />

<ArticleEditor
	superform={superformCorrectType}
	data={form}
	allTags={data.allTags}
	authorOptions={data.authorOptions}
>
	<div slot="form-end">
		<FormDateInput
			{superform}
			field="publishTime"
			label="Schemalägg publicering"
		/>
		<FormInput
			{superform}
			field="notificationText"
			label="Notistext"
			explanation="Texten som visas i notisen, om tom kommer det vara början av nyhetstexten"
		/>
		<FormCheckbox {superform} field="sendNotification" label="Skicka notis?" />
	</div>
</ArticleEditor>
