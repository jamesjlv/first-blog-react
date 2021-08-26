import Image from 'next/image';
import Link from 'next/link';
import styles from './header.module.scss';
import commomStyle from '../../styles/common.module.scss';

export default function Header(): JSX.Element {
  return (
    <div className={commomStyle.container}>
      <Link href="/">
        <a>
          <header className={`${styles.header}`}>
            <Image src="/logo.png" alt="logo" width="238.62" height="26" />
          </header>
        </a>
      </Link>
    </div>
  );
}
