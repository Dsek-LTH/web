import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import localeSv from "dayjs/locale/sv";
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.locale(localeSv);
