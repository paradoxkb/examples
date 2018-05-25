from time import time

def b_search(ar, n):
	l, r = 0, len(ar)-1

	while l <= r:
		m = (l + r) // 2
		if n == ar[m]: return m+1

		if n > ar[m]:
			l = m + 1
		elif n < ar[m]:
			r = m - 1

	return -1

def find_nums(n, t):
	base_nums = list(map(int, n.split(' ')[1:]))
	base_nums.sort()
	targets = list(map(int, t.split(' ')))

	for i in targets[1:]:
		print(b_search(base_nums, i), end=' ')

def main():
	n, m = input(), input()
	start = time()
	find_nums(n, m)
	end = time()
	print('time > ', end - start)

if __name__ == "__main__":
	main()
