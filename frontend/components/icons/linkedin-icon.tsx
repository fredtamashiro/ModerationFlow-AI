type LinkedinIconProps = {
  className?: string;
};

export function LinkedinIcon({ className }: LinkedinIconProps) {
  return (
    <svg
      viewBox="-143 145 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M329 145h-432c-22.1 0-40 17.9-40 40v432c0 22.1 17.9 40 40 40h432c22.1 0 40-17.9 40-40V185c0-22.1-17.9-40-40-40ZM41.4 508.1H-8.5V348.4h49.9v159.7ZM15.1 328.4h-.4c-18.1 0-29.8-12.2-29.8-27.7 0-15.8 12.1-27.7 30.5-27.7 18.4 0 29.7 11.9 30.1 27.7.1 15.4-11.6 27.7-30.4 27.7ZM241 508.1h-56.6v-82.6c0-21.6-8.8-36.4-28.3-36.4-14.9 0-23.2 10-27 19.6-1.4 3.4-1.2 8.2-1.2 13.1v86.3H71.8s.7-146.4 0-159.7h56.1v25.1c3.3-11 21.2-26.6 49.8-26.6 35.5 0 63.3 23 63.3 72.4v88.8Z"
        fill="currentColor"
      />
    </svg>
  );
}
