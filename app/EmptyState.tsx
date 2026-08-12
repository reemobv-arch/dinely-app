import Link from "next/link";
import styles from "./EmptyState.module.css";

export default function EmptyState({
  icon = "✦",
  title,
  text,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon?: string;
  title: string;
  text?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      {text && <p className={styles.text}>{text}</p>}
      {actionLabel &&
        (actionHref ? (
          <Link href={actionHref} className={styles.btn}>
            {actionLabel}
          </Link>
        ) : (
          <button type="button" className={styles.btn} onClick={onAction}>
            {actionLabel}
          </button>
        ))}
    </div>
  );
}
