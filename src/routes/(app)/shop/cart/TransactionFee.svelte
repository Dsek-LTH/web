<script lang="ts">
  export let fee: number;
</script>

<tr>
  <td>
    <div class="flex items-center gap-3">
      <div class="avatar">
        <div class="mask mask-squircle h-12 w-12">
          <img
            src={"https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg?q=80&w=1082"}
            alt="Stripe payment platform logo"
          />
        </div>
      </div>
      <div>
        <div class="font-bold">Stripe</div>
        <div class="text-sm opacity-50">Betalningsplattform</div>
      </div>
    </div>
  </td>
  <td class="font-medium"> Transaktionsavgift </td>
  <td class="font-semibold text-success">{fee / 100} SEK</td>
  <td class="text-center"> </td>
  <th class="text-center"> </th>
</tr>
