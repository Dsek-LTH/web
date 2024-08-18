<script lang="ts">
  import { getFileUrl } from "$lib/files/images";

  const SECTIONS = [
    {
      title: "FEST",
      slogan: "STUDENTLIVETS BÄSTA STUNDER",
      description:
        "Vi anordnar roliga evenemang som sittningar, eftersläpp och pubar. Ungefär varannan vecka är det pub i iDét och då och då är det sittningar/eftersläpp. Håll utkik i sektionskalendern för att se när nästa event är!",
      images: ["party-1.jpg", "party-2.jpg", "party-3.jpg"],
    },
    {
      title: "AKTIVITET",
      slogan: "ÄVENTYRET BÖRJAR HÄR",
      description:
        "Sektionen anordnar även fotbollsträningar, brädspels-kvällar, badminton, LAN-partyn och resor till andra universitet. Här finns något för de flesta och är det något sektionen inte gör som du tycker behövs göras finns det ofta utrymme för att driva igenom dina idéer!",
      images: ["activity-1.jpg", "activity-2.jpg", "activity-3.jpg"],
    },
  ] as const;

  const ARTICLES = [
    {
      title: "SEKTIONEN",
      description:
        "Sektionen består av 14 olika utskott, varav de flesta leds av en styrelsemedlem. Sektionsmötet som hålls några gånger per år är sektionens högsta beslutande organ. Du kan engagera dig i sektionen genom att bli funktionär i någor av alla våra utskott.",
      image: "guild.jpg",
      imagePosition: "50% 80%",
      imageSize: "125%",
    },
    {
      title: "STUDIER",
      description:
        "Vi leder och organiserar studiebevakningsarbetet på sektionen samt anordnar pluggkvällar. Detta betyder att vi samlar studenternas röster och för deras talan till skolan för att utbildningen ska behålla god kvalitet. Vi står även upp för studenters rättigheter när de kränks.",
      image: "studies.jpg",
      imagePosition: "50% 0%",
      imageSize: "150%",
    },
    {
      title: "D-CHIP",
      description:
        "D-Chip är en ideell, studentdriven förening som studenterna på Datateknik och InfoCom på LTH hör till. Alla kvinnliga och icke-binära studenter på de två programmen kan vara med i D-Chip. Vi finns för att främja er trivsel på sektionen samt att verka för mer kvinnligt och icke-binärt engagemang.",
      image: "dchip.jpg",
      imagePosition: "50% 180%",
      imageSize: "250%",
    },
  ] as const;

  const LINKS = [
    { title: "Hem", href: "/" },
    { title: "Nyheter", href: "/news" },
    { title: "Evenemang", href: "/events" },
    { title: "Sektionen", href: "/committees" },
    { title: "Kontakt", href: "/info/contact" },
  ] as const;

  const SOCIALS = [
    {
      title: "Facebook",
      href: "https://facebook.com/Dsektionen",
      icon: "i-mdi-facebook",
    },
    {
      title: "Instagram",
      href: "https://instagram.com/dseklth",
      icon: "i-mdi-instagram",
    },
    {
      title: "Discord",
      href: "https://discord.com/invite/wxHQcvZ38p",
      icon: "i-mdi-discord",
    },
    {
      title: "YouTube",
      href: "https://youtube.com/channel/UCqBtN7xlh4_VvywKaRiGfkw",
      icon: "i-mdi-youtube",
    },
    {
      title: "GitHub",
      href: "https://github.com/Dsek-LTH",
      icon: "i-mdi-github",
    },
    {
      title: "LinkedIn",
      href: "https://linkedin.com/company/dsektionen",
      icon: "i-mdi-linkedin",
    },
  ] as const;
</script>

<nav class="z-10">
  <a href="/">
    <svg
      width="32"
      height="44"
      viewBox="0 0 32 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.3708 7.4382V5.82022H26.7865C27.1461 6.17977 27.5056 6.7191 27.8652 7.25843L23.3708 7.4382ZM29.4831 6.17977C27.5056 2.58427 23.5506 0.786516 17.7978 0.786516C16.1798 0.786516 14.9213 0.966292 13.6629 1.14607V0.426966H12.9438L0.359551 6.17977V9.23596C1.25843 9.23596 1.97753 9.59551 2.51685 10.1348C3.05618 10.6742 3.41573 11.3933 3.41573 12.2921V37.2809V36.9213C3.41573 37.8202 3.05618 38.5393 2.51685 39.0787C1.97753 39.618 1.25843 39.9775 0.359551 39.9775H0V43.573H17.7978C23.5506 43.573 27.5056 41.7753 29.4831 38.1798C31.1011 35.3034 32 29.9101 32 22.1798C32 14.4494 31.1011 9.05618 29.4831 6.17977ZM23.5506 11.0337V9.5955H28.9438C29.1236 10.3146 29.3034 10.8539 29.3034 11.0337H23.5506ZM23.5506 14.4494V13.0112H29.8427C29.8427 13.3708 30.0225 13.9101 30.0225 14.6292L23.5506 14.4494ZM23.5506 18.0449V16.6067H30.2022V18.2247H23.5506V18.0449ZM23.5506 21.6404V20.0225H30.382V21.6404H23.5506ZM30.2022 25.236H23.5506V23.618H30.2022V25.236ZM6.11236 6.17977H4.49438L7.01124 4.92135C6.65169 5.2809 6.47191 5.82022 6.11236 6.17977ZM30.2022 28.8315H23.5506V27.2135H30.2022V28.8315ZM21.2135 41.236C20.8539 41.5955 20.3146 41.9551 19.7753 41.9551H18.3371V40.1573H16.7191C15.8202 40.1573 15.1011 39.7978 14.5618 39.2584C14.0225 38.7191 13.6629 38 13.6629 37.1011V4.20225C13.8427 3.12359 14.5618 2.58427 15.6404 2.58427H19.7753C20.3146 2.58427 20.8539 2.76404 21.2135 3.12359C21.573 3.48315 21.7528 4.02247 21.7528 4.5618V39.7978C21.9326 40.3371 21.7528 40.8764 21.2135 41.236ZM4.67416 9.5955C4.31461 9.05618 3.95506 8.69663 3.41573 8.1573H5.21348C4.85393 8.8764 4.85393 9.23595 4.67416 9.5955ZM29.6629 32.427H23.5506V30.809H30.0225C29.8427 31.5281 29.6629 32.0674 29.6629 32.427ZM28.764 36.0225H23.5506V34.4045H29.3034L28.764 36.0225ZM26.2472 39.4382H23.3708C23.3708 39.0787 23.3708 38.5393 23.5506 37.8202H27.8652L26.2472 39.4382ZM5.21348 38.7191C5.39326 38.1798 5.57303 37.8202 5.57303 37.2809C5.93258 38 6.11236 38.5393 6.29214 38.7191H5.21348ZM1.97753 41.9551V41.7753C2.33708 41.5955 2.8764 41.4157 3.59551 40.8764H8.08989C8.62921 41.236 9.16854 41.7753 9.52809 41.9551H1.97753Z"
        fill="white"
      />
    </svg>
  </a>

  <span class="i-mdi-menu size-8" />
</nav>

<header
  style:--url="url({getFileUrl("minio/photos/public/assets/hero.jpg")})"
  style:background-size="cover"
>
  <div class="absolute top-1/3 px-10">
    <h1 class="mb-4 text-5xl font-bold">D-SEKTIONEN</h1>
    <p class="max-w-prose">
      D-sektionen inom TLTH är en ideell organisation för studenter och alumner
      vid programmen Datateknik och InfoCom. Sektionen har sociala arrangemang,
      näringslivskontakter, studiebevakning, och allt annat som hjälper
      studenter och alumner.
    </p>

    <div class="flex flex-col items-start">
      <a
        href="/committees"
        class="mb-10 mt-20 inline-block bg-primary px-5 py-3 font-bold text-white"
      >
        ENGAGERA DIG
      </a>
      <a href="/info/for-foretag" class="font-medium">För företag</a>
    </div>
  </div>
</header>

<main class="flex flex-col gap-28">
  {#each SECTIONS as section, i}
    <section class="flex flex-col gap-14">
      <div class="carousel h-80 w-full">
        {#each section.images as image, i}
          <div id="slide{i}" class="carousel-item relative w-full">
            <img
              src={getFileUrl(`minio/photos/public/assets/${image}`)}
              class="h-full w-full object-cover"
              alt="party"
            />
          </div>
        {/each}
      </div>

      <div class="mx-10 flex flex-col gap-7">
        <h2 class="font-bold">{section.title}</h2>
        <h1 class="text-4xl font-bold">{section.slogan}</h1>
        <p class="max-w-prose text-sm">{section.description}</p>

        <div class="flex gap-6">
          <button class="size-9 bg-[#24292A]">
            <span class="i-mdi-arrow-left" />
          </button>
          <button
            class="size-9"
            class:bg-primary={i % 2 === 0}
            class:bg-secondary={i % 2 !== 0}
          >
            <span class="i-mdi-arrow-right" />
          </button>
        </div>
      </div>
    </section>
  {/each}

  <section class="mx-10 flex flex-col gap-14">
    {#each ARTICLES as article}
      <article
        style:--url="url({getFileUrl(
          `minio/photos/public/assets/${article.image}`,
        )})"
        style:background-size={article.imageSize}
        style:background-position={article.imagePosition}
        style:background-repeat="no-repeat"
      >
        <h1 class="text-xl font-bold">{article.title}</h1>
        <p class="max-w-prose text-sm font-medium text-[#BFBFBF]">
          {article.description}
        </p>
      </article>
    {/each}
  </section>

  <footer class="mb-28 flex flex-col items-center gap-20">
    <a href="/">
      <svg
        width="32"
        height="44"
        viewBox="0 0 32 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M23.3708 7.4382V5.82022H26.7865C27.1461 6.17977 27.5056 6.7191 27.8652 7.25843L23.3708 7.4382ZM29.4831 6.17977C27.5056 2.58427 23.5506 0.786516 17.7978 0.786516C16.1798 0.786516 14.9213 0.966292 13.6629 1.14607V0.426966H12.9438L0.359551 6.17977V9.23596C1.25843 9.23596 1.97753 9.59551 2.51685 10.1348C3.05618 10.6742 3.41573 11.3933 3.41573 12.2921V37.2809V36.9213C3.41573 37.8202 3.05618 38.5393 2.51685 39.0787C1.97753 39.618 1.25843 39.9775 0.359551 39.9775H0V43.573H17.7978C23.5506 43.573 27.5056 41.7753 29.4831 38.1798C31.1011 35.3034 32 29.9101 32 22.1798C32 14.4494 31.1011 9.05618 29.4831 6.17977ZM23.5506 11.0337V9.5955H28.9438C29.1236 10.3146 29.3034 10.8539 29.3034 11.0337H23.5506ZM23.5506 14.4494V13.0112H29.8427C29.8427 13.3708 30.0225 13.9101 30.0225 14.6292L23.5506 14.4494ZM23.5506 18.0449V16.6067H30.2022V18.2247H23.5506V18.0449ZM23.5506 21.6404V20.0225H30.382V21.6404H23.5506ZM30.2022 25.236H23.5506V23.618H30.2022V25.236ZM6.11236 6.17977H4.49438L7.01124 4.92135C6.65169 5.2809 6.47191 5.82022 6.11236 6.17977ZM30.2022 28.8315H23.5506V27.2135H30.2022V28.8315ZM21.2135 41.236C20.8539 41.5955 20.3146 41.9551 19.7753 41.9551H18.3371V40.1573H16.7191C15.8202 40.1573 15.1011 39.7978 14.5618 39.2584C14.0225 38.7191 13.6629 38 13.6629 37.1011V4.20225C13.8427 3.12359 14.5618 2.58427 15.6404 2.58427H19.7753C20.3146 2.58427 20.8539 2.76404 21.2135 3.12359C21.573 3.48315 21.7528 4.02247 21.7528 4.5618V39.7978C21.9326 40.3371 21.7528 40.8764 21.2135 41.236ZM4.67416 9.5955C4.31461 9.05618 3.95506 8.69663 3.41573 8.1573H5.21348C4.85393 8.8764 4.85393 9.23595 4.67416 9.5955ZM29.6629 32.427H23.5506V30.809H30.0225C29.8427 31.5281 29.6629 32.0674 29.6629 32.427ZM28.764 36.0225H23.5506V34.4045H29.3034L28.764 36.0225ZM26.2472 39.4382H23.3708C23.3708 39.0787 23.3708 38.5393 23.5506 37.8202H27.8652L26.2472 39.4382ZM5.21348 38.7191C5.39326 38.1798 5.57303 37.8202 5.57303 37.2809C5.93258 38 6.11236 38.5393 6.29214 38.7191H5.21348ZM1.97753 41.9551V41.7753C2.33708 41.5955 2.8764 41.4157 3.59551 40.8764H8.08989C8.62921 41.236 9.16854 41.7753 9.52809 41.9551H1.97753Z"
          fill="white"
        />
      </svg>
    </a>

    <ul class="flex flex-col gap-12 text-center text-xl font-medium">
      {#each LINKS as link}
        <li>
          <a href={link.href} class="uppercase">{link.title}</a>
        </li>
      {/each}
    </ul>

    <ul class="grid grid-cols-3 grid-rows-2 gap-12">
      {#each SOCIALS as social}
        <li>
          <a href={social.href} target="_blank">
            <span class="{social.icon} size-8" />
          </a>
        </li>
      {/each}
    </ul>
  </footer>
</main>

<style>
  /*
   * These styles have been imported from Figma.
   * They should be replaced with Tailwind CSS classes.
   */
  @import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap");

  nav {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0px 40px;

    position: fixed;
    width: 100%;
    height: 100px;
    left: 0px;
    top: 0px;

    background: rgba(29, 26, 27, 0.6);
    backdrop-filter: blur(4px);
  }

  header {
    height: 100vh;
    width: 100%;
    font-family: "Roboto Condensed", "Roboto", sans-serif;

    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%),
      linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), var(--url);
    backdrop-filter: blur(2px);
  }

  header h1 {
    color: #ffffff;
  }

  header p {
    color: #bfbfbf;
    font-weight: 500;
    line-height: 1.3;
  }

  main {
    background-color: #000000;
  }

  section {
    font-family: "Roboto Condensed", "Roboto", sans-serif;
    color: #ffffff;
  }

  article {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding: 50px 32px;
    gap: 20px;

    height: 400px;

    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #0d0d0d 50%),
      var(--url);
  }

  footer {
    font-family: "Roboto Condensed", "Roboto", sans-serif;
    color: #b3b3b3;
  }
</style>
