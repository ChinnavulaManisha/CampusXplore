from django.core.management.base import BaseCommand
from facilities.models import Category


class Command(BaseCommand):
    help = 'Seeds initial campus facility categories idempotently.'

    INITIAL_CATEGORIES = [
        {
            'name': 'Academic',
            'description': 'Academic blocks, lecture halls, and department offices.',
            'icon': 'GraduationCap'
        },
        {
            'name': 'Laboratories',
            'description': 'Practical research, engineering, and computing laboratories.',
            'icon': 'FlaskConical'
        },
        {
            'name': 'Library',
            'description': 'Central and departmental libraries and reading spaces.',
            'icon': 'BookOpen'
        },
        {
            'name': 'Food and Cafeteria',
            'description': 'Food courts, university mess facilities, cafeterias, and kiosks.',
            'icon': 'Utensils'
        },
        {
            'name': 'Banking and ATM',
            'description': 'On-campus bank branches and 24/7 ATM kiosks.',
            'icon': 'Landmark'
        },
        {
            'name': 'Healthcare',
            'description': 'Campus hospital, pharmacy, and medical assistance centers.',
            'icon': 'HeartPulse'
        },
        {
            'name': 'Washrooms',
            'description': 'Public and departmental restroom facilities.',
            'icon': 'Bath'
        },
        {
            'name': 'Drinking Water',
            'description': 'Purified water dispensers and coolers across campus.',
            'icon': 'Droplets'
        },
        {
            'name': 'Administration',
            'description': 'Administrative offices, admission blocks, and registrar.',
            'icon': 'Building2'
        },
        {
            'name': 'Parking',
            'description': 'Designated two-wheeler and four-wheeler parking areas.',
            'icon': 'Car'
        },
        {
            'name': 'Sports and Recreation',
            'description': 'Indoor stadiums, sports grounds, gymnasium, and recreation.',
            'icon': 'Trophy'
        },
    ]

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting category seeding...'))

        created_count = 0
        existing_count = 0

        for cat_data in self.INITIAL_CATEGORIES:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'icon': cat_data['icon']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  + Created: {category.name}"))
            else:
                existing_count += 1
                self.stdout.write(self.style.WARNING(f"  = Already exists: {category.name}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Category seeding complete! {created_count} created, {existing_count} already existed."
            )
        )
