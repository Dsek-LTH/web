<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Select from "$lib/components/Select.svelte";

  const currentYear = new Date().getFullYear();
  const years: number[] = Array.from(
    { length: currentYear - 1961 + 1 },
    (value, index) => 2024 - index,
  );
</script>

<svelte:head>
  <title>Onboarding | D-sektionen</title>
</svelte:head>

<div class="rounded-lg bg-base-200 p-10">
  <div class="max-w-sm">
    <div class="text-5xl">Welcome</div>
    <div class="text-lg">Fill in your information below</div>

    <div class="flex flex-col">
      <Input name="Förnamn" label="Förnamn" placeholder="" />
      <Input name="" label="Efternamn" placeholder="" />
      <Input
        name="pref"
        label="Food preference"
        placeholder="Ex. lactos, gluten, mushrooms"
      />
      <Select
        name="program"
        placeholder="program"
        values={["D", "C"]}
        label="Program"
      />
      <Select name="year" label="Year" values={years} />
      <div class="pt-6">
        <button name="save" class="btn bg-base-300 text-primary">
          <span class="i-mdi-floppy-disc size-5 bg-primary"></span>
          Save
        </button>
      </div>
    </div>
  </div>
</div>
