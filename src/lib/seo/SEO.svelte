<!-- 
  This component adds metadata to a page for search engine optimization reasons.
  It uses Open Graph protocol to define how the page should be represented on social media platforms.
  https://ogp.me/
-->

<script lang="ts">
  import { page } from "$app/state";
  import type { Article, Member } from "@prisma/client";

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types#image_types
  type ImageMimeType =
    | "image/apng"
    | "image/avif"
    | "image/gif"
    | "image/jpeg"
    | "image/png"
    | "image/svg+xml"
    | "image/webp";

  type ArticleOpenGraphProps = Pick<
    Article,
    "header" | "body" | "publishedAt" | "updatedAt" | "imageUrl" | "slug"
  > & {
    authorName: string;
  };

  type MemberOpenGraphProps = Pick<
    Member,
    "firstName" | "lastName" | "studentId" | "picturePath" | "bio"
  >;

  type OpenGraphProps = {
    data:
      | {
          type: "article";
          article: ArticleOpenGraphProps;
        }
      | {
          type: "profile";
          member: MemberOpenGraphProps;
        }
      | {
          type: "website";
          props: {
            title: string;
            description?: string;
          };
        };

    image?: {
      url: string;
      secure_url?: string;
      alt: string;
      mime_type: ImageMimeType;
      height: number;
      width: number;
    };
  };

  let { image, data }: OpenGraphProps = $props();

  let { locale, locale_alternate } = page.url.pathname.includes("/en")
    ? { locale: "en_US", locale_alternate: ["se_SE"] }
    : { locale: "se_SE", locale_alternate: ["en_US"] };

  function articleToOpenGraphProps(article: ArticleOpenGraphProps) {
    let props: Array<[string, string]> = [];
    props.push(["og:type", "article"]);
    props.push(["og:title", article.header]);
    props.push(["og:description", article.body]);
    props.push(["og:article:author", article.authorName]);
    if (article.publishedAt) {
      props.push(["article:published_time", article.publishedAt.toISOString()]);
    }
    if (article.updatedAt) {
      props.push(["article:modified_time", article.updatedAt.toISOString()]);
    }
    if (article.imageUrl) {
      props.push(["og:image", article.imageUrl]);
    }
    return props;
  }

  function profileToOpenGraphProps(member: MemberOpenGraphProps) {
    let props: Array<[string, string]> = [];
    props.push(["og:type", "profile"]);
    props.push(["og:title", `${member.firstName} ${member.lastName}`]);
    if (member.firstName) {
      props.push(["profile:first_name", member.firstName]);
    }
    if (member.lastName) {
      props.push(["profile:last_name", member.lastName]);
    }
    if (member.studentId) {
      props.push(["profile:username", member.studentId]);
    }
    if (member.bio) {
      props.push(["og:description", member.bio]);
    }
    if (member.picturePath) {
      props.push(["og:image", member.picturePath]);
    }
    return props;
  }

  function websiteToOpenGraphProps(website: {
    title: string;
    description?: string;
  }) {
    let props: Array<[string, string]> = [];
    props.push(["og:type", "website"]);
    props.push(["og:title", website.title]);
    if (website.description)
      props.push(["og:description", website.description]);
    if (image) props.push(["og:image", image.url]);
    return props;
  }

  let attributesProps: Array<[string, string]> = $state([]);
  if (data.type === "article") {
    attributesProps = articleToOpenGraphProps(data.article);
  } else if (data.type === "profile") {
    attributesProps = profileToOpenGraphProps(data.member);
  } else {
    attributesProps = websiteToOpenGraphProps(data.props);
  }
</script>

<svelte:head>
  <meta property="og:site_name" content="D-sektionen" />
  <meta property="og:locale" content={locale} />
  {#each locale_alternate as loc}
    <meta property="og:locale:alternate" content={loc} />
  {/each}
  <meta property="og:url" content={page.url.toString()} />
  {#if image}
    <meta property="og:image" content={image.url} />
    <meta property="og:secure_url" content={image.secure_url} />
    <meta property="og:image:width" content={image.width.toString()} />
    <meta property="og:image:height" content={image.height.toString()} />
    <meta property="og:image:alt" content={image.alt} />
    <meta property="og:image:type" content={image.mime_type} />
  {/if}

  {#each attributesProps as [key, value]}
    <meta property={key} content={value} />
  {/each}
</svelte:head>
