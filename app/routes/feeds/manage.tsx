import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/db.server";
import invariant from "tiny-invariant";
import type { Category } from "@prisma/client";
import type { FeedWithCategory } from "~/types/FeedWithCategory";
type ActionData = { success: boolean; msg?: string };
type LoaderData = { feeds: FeedWithCategory[]; categories: Category[] };
export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const feed = data.get("feed");
  const category = data.get("category");
  const _action = data.get("_action");
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  if (_action === "add") {
    invariant(
      category && typeof category === "string",
      "category must not be null."
    );
    await prisma.category.create({
      data: { name: category, user: { connect: { id: user.id } } },
    });
    return json<ActionData>({
      success: true,
      msg: "Category Added Successfully.",
    });
  } else if (_action === "change") {
    invariant(
      category && typeof category === "string",
      "Category must be a string"
    );
    invariant(feed && typeof feed === "string", "Feed must be defined.");
    if (parseInt(category) <= 0) {
      return json<ActionData>({
        success: false,
        msg: "You must select a category.",
      });
    }
    await prisma.subscribe.updateMany({
      data: { categoryId: parseInt(category) },

      where: { feedId: parseInt(feed), userId: user.id },
    });
    return json<ActionData>({
      success: true,
      msg: "Category Changed Successfully.",
    });
  }

  return json<ActionData>({ success: true });
};
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const feeds = await prisma.$queryRaw<
    FeedWithCategory[]
  >`select f.*, "categoryId" from "Feed" f inner join "Subscribe" s on s."feedId"=f."id" where s."userId"=${user.id}`;
  const categories = await prisma.$queryRaw<
    Category[]
  >`select c.* from "Category" c where c."userId"=${user.id}`;
  return json<LoaderData>({ feeds, categories });
};
export default function Manage() {
  const { feeds, categories } = useLoaderData<LoaderData>();
  const { msg } = useActionData<ActionData>() || {
    success: false,
    msg: "",
  };
  const transition = useTransition();
  const options = categories.map((c) => {
    return (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    );
  });
  return (
    <div className="flex flex-col justify-center items-center gap-y-4 text-center">
      <h1>Manage Categories</h1>
      <Form
        className="flex flex-col justify-center items-center gap-y-4 "
        method="post"
      >
        <h2>Add Category</h2>
        <div className="flex flex-col justify-center items-center gap-y-2 ">
          <label htmlFor="name">Name</label>

          <input type="text" name="category" id="name" />
        </div>
        <button
          className="btn-sky-600"
          type="submit"
          name="_action"
          value="add"
        >
          Add
        </button>
      </Form>

      {transition.state === "idle" && <div role="alert">{msg}</div>}
      {categories.length > 0 && (
        <>
          <h2>Assign Feed to Category</h2>
          {feeds.map((f) => {
            if (f.categoryId === null) f.categoryId = -1;

            return (
              <Form
                className="flex flex-col justify-center items-center gap-y-4 "
                method="post"
                key={f.id}
              >
                <div className="flex flex-col justify-center items-center gap-y-2 ">
                  <label htmlFor={`category${f.id}`}>{f.title}</label>
                  <select
                    id={`category${f.id}`}
                    defaultValue={f.categoryId}
                    name="category"
                  >
                    {options}
                  </select>
                </div>
                <input type="hidden" name="feed" value={f.id} />
                <button
                  className="btn-sky-600"
                  type="submit"
                  name="_action"
                  value="change"
                >
                  Update
                </button>
              </Form>
            );
          })}
        </>
      )}
    </div>
  );
}
