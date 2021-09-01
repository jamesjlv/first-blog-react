import { createElement } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Header from '../components/Header';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  function handleUpdatePosts(): void {
    fetch(posts.next_page)
      .then(response => response.json())
      .then(data =>
        setPosts({
          next_page: data.next_page,
          results: [...posts.results, ...data.results],
        })
      );
  }

  return (
    <>
      <Head>
        <title>Home | First Blog</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        {posts.results.map(post => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data?.title}</h1>
                <h2>{post.data?.subtitle}</h2>
              </a>
            </Link>
            <span>
              <time>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
                  locale: ptBR,
                })}
              </time>
              <FiUser />
              {post.data?.author}
            </span>
          </div>
        ))}
        {posts.next_page
          ? createElement(
              'button',
              {
                type: 'button',
                onClick: handleUpdatePosts,
                className: styles.button,
              },
              'Carregar mais posts'
            )
          : ''}
        {preview && (
          <aside className={styles.previewButton}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query('', {
    pageSize: 1,
    page: 1,
    ref: previewData?.ref ?? null,
  });
  const { next_page, results } = postsResponse;

  return {
    props: {
      postsPagination: {
        next_page,
        results,
      },
      preview,
    },
    revalidate: 30 * 24 * 60,
  };
};
