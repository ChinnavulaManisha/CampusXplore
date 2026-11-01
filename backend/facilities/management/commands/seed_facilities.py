from decimal import Decimal
from django.core.management.base import BaseCommand
from facilities.models import Category, Facility


class Command(BaseCommand):
    help = 'Seeds initial campus facilities idempotently.'

    INITIAL_FACILITIES = [
        {
            'name': 'Central Library',
            'building': 'Block 37',
            'category_name': 'Library',
            'latitude': Decimal('31.253600'),
            'longitude': Decimal('75.703200'),
            'description': 'Central university library featuring 4 floors of study halls, 150,000+ volumes, digital media resources, and quiet reading spaces.',
            'opening_hours': '08:00 AM – 10:00 PM',
            'contact_number': '+91 1824 517100',
            'is_active': True,
        },
        {
            'name': 'Indoor Sports Complex',
            'building': 'Shanti Devi Stadium',
            'category_name': 'Sports and Recreation',
            'latitude': Decimal('31.257000'),
            'longitude': Decimal('75.708000'),
            'description': 'World-class athletic complex featuring Olympic-standard badminton courts, basketball arena, and high-performance gymnasium.',
            'opening_hours': '06:00 AM – 09:00 PM',
            'contact_number': '+91 1824 517350',
            'is_active': True,
        },
        {
            'name': 'UniMall & Student Plaza',
            'building': 'Central Avenue',
            'category_name': 'Food and Cafeteria',
            'latitude': Decimal('31.253400'),
            'longitude': Decimal('75.703600'),
            'description': 'Premier campus commercial and dining hub featuring 40+ dining outlets, banking kiosk hub, stationery, and student services.',
            'opening_hours': '08:00 AM – 11:00 PM',
            'contact_number': '+91 1824 517400',
            'is_active': True,
        },
        {
            'name': 'Computer Science Department',
            'building': 'Block 38',
            'category_name': 'Academic',
            'latitude': Decimal('31.254800'),
            'longitude': Decimal('75.706100'),
            'description': 'Advanced computing labs, AI innovation hub, robotics cluster, and faculty chambers across floors 2 to 5.',
            'opening_hours': '09:00 AM – 06:00 PM',
            'contact_number': '+91 1824 517220',
            'is_active': True,
        },
        {
            'name': 'Baldev Raj Mittal Auditorium',
            'building': 'Block 13',
            'category_name': 'Administration',
            'latitude': Decimal('31.256200'),
            'longitude': Decimal('75.704500'),
            'description': '2,500-seater acoustic auditorium hosting university convocations, national symposia, and cultural events.',
            'opening_hours': '09:00 AM – 08:00 PM',
            'contact_number': '+91 1824 517112',
            'is_active': True,
        },
        {
            'name': 'UniHospital & Health Center',
            'building': 'Block 30',
            'category_name': 'Healthcare',
            'latitude': Decimal('31.255000'),
            'longitude': Decimal('75.702000'),
            'description': '24/7 on-campus medical assistance center with resident doctors, ambulance emergency service, and pharmacy.',
            'opening_hours': 'Open 24 Hours',
            'contact_number': '+91 1824 517111',
            'is_active': True,
        },
        {
            'name': 'Campus Banking & ATM Hub',
            'building': 'Block 32',
            'category_name': 'Banking and ATM',
            'latitude': Decimal('31.254000'),
            'longitude': Decimal('75.704000'),
            'description': 'On-campus bank branch and 24/7 multi-bank ATM kiosks providing full retail banking and student fee deposit services.',
            'opening_hours': '09:30 AM – 04:30 PM (ATMs 24/7)',
            'contact_number': '+91 1824 517200',
            'is_active': True,
        },
    ]

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting facility seeding...'))

        created_count = 0
        updated_count = 0

        for fac_data in self.INITIAL_FACILITIES:
            category, _ = Category.objects.get_or_create(
                name=fac_data['category_name'],
                defaults={'description': f"{fac_data['category_name']} facilities"}
            )

            facility, created = Facility.objects.update_or_create(
                name=fac_data['name'],
                defaults={
                    'category': category,
                    'building': fac_data['building'],
                    'latitude': fac_data['latitude'],
                    'longitude': fac_data['longitude'],
                    'description': fac_data['description'],
                    'opening_hours': fac_data['opening_hours'],
                    'contact_number': fac_data['contact_number'],
                    'is_active': fac_data['is_active'],
                }
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  + Created: {facility.name} ({facility.building})"))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f"  = Updated/verified: {facility.name} ({facility.building})"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Facility seeding complete! {created_count} created, {updated_count} updated/verified."
            )
        )
