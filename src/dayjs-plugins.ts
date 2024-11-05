/**
 * @deprecated
 * This file is deprecated and will be removed in the future.
 * Please import the plugins you need directly in your code.
 * Adding a plugin multiple times will not cause any issues.
 */
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import localeSv from "dayjs/locale/sv";
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.locale(localeSv);
