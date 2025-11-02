import type { PostWithAuthor, User, CommentWithAuthor } from './definitions';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alisha Sharma',
    email: 'alisha@example.com',
    password: 'hashed_password',
    role: 'ALUMNI',
    bio: 'Software Engineer at Google. Passionate about AI and machine learning. Class of 2018.',
    profileImage: 'https://picsum.photos/seed/user1/200/200',
    course: 'Computer Science',
    batch: 2018,
    profession: 'Software Engineer',
    createdAt: new Date('2024-01-10T10:00:00Z'),
  },
  {
    id: '2',
    name: 'Rohan Verma',
    email: 'rohan@example.com',
    password: 'hashed_password',
    role: 'STUDENT',
    bio: 'Final year student, exploring opportunities in web development. Eager to connect with alumni!',
    profileImage: 'https://picsum.photos/seed/user2/200/200',
    course: 'Information Technology',
    batch: 2025,
    profession: null,
    createdAt: new Date('2024-02-15T11:30:00Z'),
  },
  {
    id: '3',
    name: 'Dr. Priya Singh',
    email: 'priya.s@example.com',
    password: 'hashed_password',
    role: 'ADMIN',
    bio: 'Professor, Department of Computer Science. Helping students bridge the gap between academia and industry.',
    profileImage: 'https://picsum.photos/seed/user3/200/200',
    course: 'Computer Science',
    batch: null,
    profession: 'Professor',
    createdAt: new Date('2024-01-01T09:00:00Z'),
  },
];

export const mockPosts: PostWithAuthor[] = [
  {
    id: 'post1',
    title: 'Internship Opportunity at Google',
    content: "Hey everyone! We have a few openings for summer interns on our Cloud AI team. It's a great opportunity to work on cutting-edge technology. Feel free to DM me for details. #internship #google #ai",
    imageUrl: 'https://picsum.photos/seed/post1/800/400',
    authorId: '1',
    createdAt: new Date('2024-05-20T14:00:00Z'),
    author: mockUsers[0],
    _count: { likes: 128, comments: 12 },
  },
  {
    id: 'post2',
    title: 'Looking for Project Guidance',
    content: "Hi seniors! I'm working on my final year project on a MERN stack application and would love some guidance on implementing real-time notifications. Any help would be appreciated! #webdev #mern #projecthelp",
    imageUrl: null,
    authorId: '2',
    createdAt: new Date('2024-05-18T09:25:00Z'),
    author: mockUsers[1],
    _count: { likes: 45, comments: 8 },
  },
  {
    id: 'post3',
    title: 'Annual Alumni Meet 2024',
    content: "We are excited to announce the Annual Alumni Meet on July 15th, 2024. It's a fantastic chance to reconnect with old friends and make new connections. RSVP link in the college portal. See you there! #alumnimeet #networking",
    imageUrl: 'https://picsum.photos/seed/post3/800/400',
    authorId: '3',
    createdAt: new Date('2024-05-15T18:00:00Z'),
    author: mockUsers[2],
    _count: { likes: 250, comments: 42 },
  },
];

export const mockComments: CommentWithAuthor[] = [
    {
        id: 'comment1',
        text: 'This sounds amazing! I will definitely apply.',
        authorId: '2',
        postId: 'post1',
        createdAt: new Date('2024-05-20T15:00:00Z'),
        author: mockUsers[1],
    },
    {
        id: 'comment2',
        text: 'Great initiative Alisha. Happy to see our alumni doing so well.',
        authorId: '3',
        postId: 'post1',
        createdAt: new Date('2024-05-20T16:30:00Z'),
        author: mockUsers[2],
    }
]
