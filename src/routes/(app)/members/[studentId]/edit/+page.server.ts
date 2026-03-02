import { getCurrentDoorPoliciesForMember } from "$lib/utils/member";
import { memberSchema } from "$lib/zod/schemas";
import * as m from "$paraglide/messages";
import { error, fail, redirect } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { PUBLIC_BUCKETS_MEMBERS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import sharp from "sharp";
import { withFiles } from "sveltekit-superforms/server";
import { v4 as uuid } from "uuid";
import type { Actions, PageServerLoad } from "./$types";
import { deletePictureSchema, uploadPictureSchema } from "../types";
import { removeMyProfilePicture } from "$lib/files/photos/profilePictures";
import DOMPurify from "isomorphic-dompurify";

const PROFILE_PICTURE_PREFIX = (studentId: string) =>
  `public/${studentId}/profile-picture`;

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const { studentId } = params;

  const [memberResult, phadderGroupsResult] = await Promise.allSettled([
    prisma.member.findUnique({
      where: {
        studentId: studentId,
      },
      include: {
        nollaIn: true,
        mandates: {
          include: {
            phadderIn: true,
            position: {
              include: {
                committee: true,
              },
            },
          },
        },
        authoredEvents: {
          orderBy: {
            startDatetime: "desc",
          },
          take: 5,
        },
        doorAccessPolicies: {},
      },
    }),
    prisma.phadderGroup.findMany({
      orderBy: {
        year: "asc",
      },
    }),
  ]);
  if (memberResult.status === "rejected")
    throw error(500, m.members_errors_couldntFetchMember());
  if (!memberResult.value) throw error(404, m.members_errors_memberNotFound());
  if (phadderGroupsResult.status === "rejected")
    throw error(505, phadderGroupsResult.reason);
  const member = memberResult.value;

  const doorAccess =
    member.id === user?.memberId
      ? await getCurrentDoorPoliciesForMember(prisma, studentId)
      : [];

  try {
    return {
      form: await superValidate(member, zod4(memberSchema)),
      viewedMember: member, // https://github.com/Dsek-LTH/web/issues/194
      doorAccess,
      phadderGroups: phadderGroupsResult.value,
      uploadForm: await superValidate(zod4(uploadPictureSchema)),
      deleteForm: await superValidate(zod4(deletePictureSchema)),
    };
  } catch {
    throw error(500, m.members_errors_couldntFetchPings());
  }
};

const updateSchema = memberSchema
  .pick({
    firstName: true,
    lastName: true,
    nickname: true,
    foodPreference: true,
    classProgramme: true,
    classYear: true,
    graduationYear: true,
    nollningGroupId: true,
    language: true,
    bio: true,
  })
  .partial();

export type UpdateSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  uploadPicture: async ({ params, locals, request }) => {
    const formData = await request.formData();
    console.log(formData);
    const form = await superValidate(formData, zod4(uploadPictureSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const { image } = form.data;
    const fileName = uuid();
    try {
      const buffer = await sharp(await image.arrayBuffer())
        // this is required to keep the image upright
        .rotate()
        // crop image according to frontend settings
        .extract({
          left: form.data.cropX,
          top: form.data.cropY,
          width: form.data.cropWidth,
          height: form.data.cropHeight,
        })
        // resize to MAX 400x400
        .resize(400, 400, {
          fit: "cover",
          withoutEnlargement: true,
        })
        // save as webp
        .webp()
        .toBuffer();
      const putUrl = await fileHandler.getPresignedPutUrl(
        locals.user,
        PUBLIC_BUCKETS_MEMBERS,
        `${PROFILE_PICTURE_PREFIX(params.studentId)}/${fileName}.webp`,
      );
      const res = await fetch(putUrl, {
        method: "PUT",
        body: buffer,
      });
      if (!res.ok)
        return message(
          form,
          {
            message: `${m.members_errors_couldntUploadFile()}: ${await res.text()}`,
            type: "error",
          },
          { status: 500 },
        );
    } catch (e) {
      console.log(e);
      const errMsg = e instanceof Error ? e.message : String(e);
      return message(
        form,
        {
          message: `${m.members_errors_couldntUploadFile()}: ${errMsg}`,
          type: "error",
        },
        { status: 500 },
      );
    }
    return message(form, {
      message: m.members_pictureUploaded(),
      type: "success",
    });
  },
  deletePicture: async ({ params, locals, request }) => {
    console.log("trying to delete picture");
    const form = await superValidate(request, zod4(deletePictureSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const fileName = form.data.fileName;
    if (locals.user.studentId === params.studentId) {
      await removeMyProfilePicture(
        `${PROFILE_PICTURE_PREFIX(params.studentId)}/${fileName}`,
        locals.user,
      );
    } else {
      await fileHandler.remove(locals.user, PUBLIC_BUCKETS_MEMBERS, [
        `${PROFILE_PICTURE_PREFIX(params.studentId)}/${fileName}`,
      ]);
    }
    return message(form, {
      message: m.members_pictureRemoved(),
      type: "success",
    });
  },
  update: async ({ params, locals, request }) => {
    const { prisma } = locals;
    //console.log(await request.formData());
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;

    const { bio, ...rest } = form.data;
    await prisma.member.update({
      where: { studentId },
      data: {
        bio: bio ? DOMPurify.sanitize(bio) : bio,
        ...rest,
      },
    });

    throw redirect(302, `/members/${params.studentId}`);
  },
};
