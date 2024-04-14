<script lang="ts">
  import PurchaseSection from "./PurchaseSection.svelte";

  export let data;

  // const examleitem = {
  //   // ...info,
  //   questions: [
  //     {
  //       title: "Alkoholpaket",
  //       description:
  //         "Vill du ha vin med din mat? Välj i så fall med eller utan alkohol",
  //       type: "choice",
  //       choices: [
  //         { answer: "Ja, med Alkohol", price: 9000 },
  //         { answer: "Ja, alkoholfritt", price: 7500 },
  //         { answer: "Nej", price: 0 },
  //       ],
  //     },
  //     {
  //       title: "Punschpaket",
  //       type: "choice",
  //       choices: [
  //         { answer: "3st, med alkohol", price: 12000 },
  //         { answer: "2st, med alkohol", price: 8000 },
  //         { answer: "1st, med alkohol", price: 4000 },
  //         { answer: "3st, utan alkohol", price: 9000 },
  //         { answer: "2st, utan alkohol", price: 6000 },
  //         { answer: "1st, utan alkohol", price: 3000 },
  //         { answer: "Inga punsch", price: 0 },
  //       ],
  //     },
  //   ],
  // };
</script>

<svelte:head>
  <title>Kundvagn | D-sektionen</title>
</svelte:head>

<article class="flex flex-col">
  <!-- Cart list wiht all items that have fully answered questions -->
  <!-- They show title, other info, price and ability to edit questions (if any), and ability to remove from cart -->
  <!-- Some items have a time limit (tickets), show ticking down timer until removed from cart -->

  <!-- If any tickets with unanswered questions exists, open a modal showing one item at a time. At the top, display the item info (name, price, info etc) and then all the questsions at once below it.render
Some questions are multiple choice, some are free-text (says in the data which). If multiple choice, some choices might result in a higher price. -->
  <h1>Kundvagn</h1>
  <PurchaseSection purchaseForm={data.purchaseForm} />
</article>
