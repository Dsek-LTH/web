<!-- 
  This component adds metadata to a page for search engine optimization reasons.
  It uses Open Graph protocol to define how the page should be represented on social media platforms.
  https://ogp.me/
-->

<script lang="ts">
  import { page } from "$app/state";
  import { getFileUrl } from "$lib/files/client";
  import type { Article, Committee, Member } from "@prisma/client";

  let { image, data }: OpenGraphProps = $props();

  let actualImage = $state<ImageAttributes | null>(null);

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types#image_types
  type ImageMimeType =
    | "image/apng"
    | "image/avif"
    | "image/gif"
    | "image/jpeg"
    | "image/png"
    | "image/svg+xml"
    | "image/webp";

  interface ImageAttributes {
    url?: string | null;
    secure_url?: string | null;
    alt?: string | null;
    mime_type: ImageMimeType;
    /**
     * og:image should be at least 200px in both dimensions, with 1500x1500 preferred.
     */
    height: number;
    /**
     * og:image should be at least 200px in both dimensions, with 1500x1500 preferred.
     */
    width: number;
  }

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

  type CommitteeOpenGraphProps = Pick<
    Committee,
    "name" | "description" | "lightImageUrl"
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
          type: "committee";
          committee: CommitteeOpenGraphProps;
        }
      | {
          type: "website";
          props: {
            title: string;
            description?: string | null;
          };
        };
    image?: ImageAttributes;
  };

  let { locale, locale_alternate } = page.url.pathname.includes("/en")
    ? { locale: "en_US", locale_alternate: ["se_SE"] }
    : { locale: "se_SE", locale_alternate: ["en_US"] };

  function articleToOpenGraphProps(article: ArticleOpenGraphProps) {
    let props: Array<[string, string]> = [];
    props.push(["og:type", "article"]);
    props.push(["og:title", article.header]);
    props.push(["og:description", article.body]);
    props.push(["og:article:author", article.authorName]);
    if (article.publishedAt)
      props.push(["article:published_time", article.publishedAt.toISOString()]);
    if (article.updatedAt)
      props.push(["article:modified_time", article.updatedAt.toISOString()]);
    return props;
  }

  function profileToOpenGraphProps(member: MemberOpenGraphProps) {
    let props: Array<[string, string]> = [];
    props.push(["og:type", "profile"]);
    props.push(["og:title", `${member.firstName} ${member.lastName}`]);
    if (member.firstName) props.push(["profile:first_name", member.firstName]);
    if (member.lastName) props.push(["profile:last_name", member.lastName]);
    if (member.studentId) props.push(["profile:username", member.studentId]);
    if (member.bio) props.push(["og:description", member.bio]);
    return props;
  }

  function committeeToOpenGraphProps(committee: CommitteeOpenGraphProps) {
    let props: Array<[string, string]> = [];
    props.push(["og:type", "website"]);
    props.push(["og:title", committee.name]);
    if (committee.description)
      props.push(["og:description", committee.description]);
    return props;
  }

  function websiteToOpenGraphProps(website: {
    title: string;
    description?: string | null;
  }) {
    let props: Array<[string, string]> = [];
    props.push(["og:type", "website"]);
    props.push(["og:title", website.title]);
    if (website.description)
      props.push(["og:description", website.description]);
    return props;
  }

  let attributesProps: Array<[string, string]> = $state([]);
  if (data.type === "article") {
    attributesProps = articleToOpenGraphProps(data.article);
  } else if (data.type === "profile") {
    attributesProps = profileToOpenGraphProps(data.member);
  } else if (data.type === "committee") {
    attributesProps = committeeToOpenGraphProps(data.committee);
  } else {
    attributesProps = websiteToOpenGraphProps(data.props);
  }
  if (image) actualImage = image;
  else if (data.type === "article" && data.article.imageUrl) {
    actualImage = {
      url: data.article.imageUrl,
      secure_url: data.article.imageUrl,
      alt: data.article.header,
      mime_type: "image/jpeg",
      height: 1500,
      width: 1500,
    };
  } else if (data.type === "profile" && data.member.picturePath) {
    actualImage = {
      url: data.member.picturePath,
      secure_url: data.member.picturePath,
      alt: `${data.member.firstName} ${data.member.lastName}`,
      mime_type: "image/jpeg",
      height: 1500,
      width: 1500,
    };
  } else if (data.type === "committee" && data.committee.lightImageUrl) {
    actualImage = {
      url: data.committee.lightImageUrl,
      secure_url: data.committee.lightImageUrl,
      alt: data.committee.name,
      mime_type: "image/svg+xml",
      height: 1500,
      width: 1500,
    };
  } else {
    actualImage = {
      url: getFileUrl("minio/photos/public/assets/guild-logo-full.svg"),
      secure_url: getFileUrl("minio/photos/public/assets/guild-logo-full.svg"),
      alt: "D-sektionen logo",
      mime_type: "image/svg+xml",
      height: 1500,
      width: 1500,
    };
  }
</script>

<svelte:head>
  <meta property="og:site_name" content="D-sektionen" />
  <meta property="og:locale" content={locale} />
  {#each locale_alternate as loc}
    <meta property="og:locale:alternate" content={loc} />
  {/each}
  <meta property="og:url" content={page.url.toString()} />
  {#if actualImage}
    <meta property="og:image" content={actualImage.url} />
    <meta property="og:secure_url" content={actualImage.secure_url} />
    <meta property="og:image:width" content={actualImage.width.toString()} />
    <meta property="og:image:height" content={actualImage.height.toString()} />
    <meta property="og:image:alt" content={actualImage.alt} />
    <meta property="og:image:type" content={actualImage.mime_type} />
  {/if}

  {#each attributesProps as [key, value]}
    <meta property={key} content={value} />
  {/each}
</svelte:head>
